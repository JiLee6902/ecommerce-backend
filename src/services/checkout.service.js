'use strict'

const { acquireLock, releaseLock } = require("./redis.service")
const { BadRequestError } = require("../core/error.response")
const { discount } = require("../models/discount.model")
const { order } = require("../models/order.model")
const userModel = require("../models/user.model")
const { findCartById } = require("../models/repositories/cart.repo")
const { v4: uuidv4 } = require('uuid');
const { checkProductByServer } = require("../models/repositories/product.repo")
const { convertToObjectIdMongoDb } = require("../utils")
const { publishInventoryUpdate, publishOrderCreated, publishEmailSend, publishNotification, publishOrderSuccessed, publishOrderConfirmed } = require("../utils/rabbitmqProducer")
const { getDiscountAmount } = require("./discount.service")
const { sendEmailOrderShipping, sendMailCancelOrder } = require("./email.service")

const { forEach } = require("lodash")
const Payment = require("../models/payment.model")

class CheckoutService {

    /*  
       {
           cartId,
           userId,
           shop_order_ids: [
               {
                   shopId,
                   shop_discounts: [
                       {
                           shopId,
                           discountId, 
                           codeId
                       }
                   ],
                   item_products: 
                   [
                     {
                       price,
                       quantity,
                       productId
                     }, 
                     {
                       price,
                       quantity,
                       productId
                     }
                
                    ]
               },
               {
                   shopId,
                   shop_discount: [],
                   item_products: [{
                       price,
                       quantity,
                       productId
                   }]
               }
           ],
           version
       }
   */
    static async checkoutReview({ cartId, userId, shop_order_ids }) {
        //check cartId
        const foundCart = await findCartById(cartId)
        if (!foundCart) throw new BadRequestError('Cart does not exist!')


        const checkout_order = {
            totalPrice: 0, //tổng tiền hàng
            freeShip: 0, //phi vận chuyển
            totalDiscount: 0, // tổng tiền discount giảm giá
            totalCheckout: 0
        }, shop_order_ids_new = []
        /*
        shop_order_ids_new <=> order_products: [
               {
                   shopId,
                   shop_discount: [
                       {
                           shopId,
                           discountId, 
                           codeId
                       }
                   ],
                   item_products: [{
                       price,
                       quantity,
                       productId
                   }],
                   priceRaw,
                   priceApplyDiscount
                },
                  {
                   shopId,
                   shop_discount: [
                       {
                           shopId,
                           discountId, 
                           codeId
                       }
                   ],
                   item_products: [{
                       price,
                       quantity,
                       productId
                   }],
                   priceRaw,
                   priceApplyDiscount
                }
           ]
        */

        for (let i = 0; i < shop_order_ids.length; i++) {
            const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]


            const checkProductServer = await checkProductByServer(item_products)
            if (checkProductServer.some(item => item === undefined)) throw new BadRequestError('Order wrong!')

            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            checkout_order.totalPrice += checkoutPrice

            const itemCheckout = {
                shopId,
                shop_discounts,
                priceRaw: checkoutPrice,
                priceApplyDiscount: checkoutPrice,
                item_products: checkProductServer
            }


            if (shop_discounts.length > 0) {
                let discountPrice = 0;
                const discountPromises = shop_discounts.map(async p => {
                    const { discount } = await getDiscountAmount({
                        codeId: p.codeId,
                        userId: userId,
                        shopId: p.shopId,
                        products: checkProductServer
                    })
                    console.log("DISCOUNT:::", discount)
                    discountPrice += +discount;
                    checkout_order.totalDiscount += +discount
                });
                await Promise.all(discountPromises);


                itemCheckout.priceApplyDiscount = checkoutPrice - discountPrice

            }


            checkout_order.totalCheckout += itemCheckout.priceApplyDiscount

            shop_order_ids_new.push(itemCheckout);
        }

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkout_order
        }
    }

    //Optimistic 
    static async orderByUser({
        shop_order_ids,
        cartId,
        userId,
        user_address = {},
        user_payment = {}
    }) {
        const { shop_order_ids_new, checkout_order } = await CheckoutService.checkoutReview
            ({ cartId, userId, shop_order_ids })

        const products = shop_order_ids_new.flatMap(order => order.item_products.map(product => ({
            ...product,
            shopId: order.shopId
        })))
        const acquireProduct = []
        for (let i = 0; i < products.length; i++) {
            const { productId, quantity, shopId } = products[i]
            const { key, uniqueValue } = await acquireLock(productId, quantity, cartId, shopId)
            acquireProduct.push(key ? true : false)
            if (key) {
                await releaseLock(key, uniqueValue)
            }
        }

        if (acquireProduct.includes(false)) {
            throw new BadRequestError('Mot so san pham da duoc cap nhat, vui long quay lai gio hang...')
        }

        const newOrder = await order.create({
            order_userId: userId,
            order_checkout: checkout_order,
            order_shipping: user_address,
            order_payment: user_payment,
            order_products: shop_order_ids_new,
            order_trackingNumber: uuidv4(),
            order_status: 'pending',
            order_confirm_deadline: new Date(Date.now() + 5 * 60 * 1000),
            shops_confirmation: shop_order_ids_new.map(order => ({
                shopId: order.shopId,
                status: 'pending'
            }))
        })

        if (newOrder) {

            await publishOrderCreated({
                orderId: newOrder._id, userId,
                order_trackingNumber: newOrder.order_trackingNumber
            })

            await publishEmailSend({
                userId,
                orderId: newOrder._id,
                email: userAccount.usr_email,
            });

            setTimeout(async () => {
                await OrderService.autoConfirmOrder(newOrder._id)
            }, 5 * 60 * 1000)
        }

        return newOrder;
    }

    static async autoConfirmOrder(orderId) {
        const existingOrder = await order.findById(orderId)
        if (!existingOrder || existingOrder.order_status !== 'pending') {
            return
        }

        const hasRejected = existingOrder.shops_confirmation.some(shop => shop.status === 'rejected')

        if (hasRejected) {
            await CheckoutService.cancelOrder({
                orderId,
                userId: existingOrder.order_userId,
            })
        } else {
            existingOrder.order_status = 'confirmed'
            existingOrder.shops_confirmation = existingOrder.shops_confirmation.map(shop => ({
                ...shop,
                status: shop.status === 'pending' ? 'confirmed' : shop.status
            }))
            await existingOrder.save()

            await publishOrderConfirmed({
                orderId, userId: existingOrder.order_userId
            });
        }
    }

    static async shopConfirmOrder({ orderId, shopId, status, reason = '' }) {
        const existingOrder = await order.findById(orderId)
        if (!existingOrder || existingOrder.order_status !== 'pending') {
            throw new BadRequestError('Order not found or cannot be modified')
        }

        const shopConfirmation = existingOrder.shops_confirmation.find(
            shop => shop.shopId.toString() === shopId
        )
        if (!shopConfirmation) {
            throw new BadRequestError('Shop not found in this order')
        }
        shopConfirmation.status = status
        shopConfirmation.reason = reason
        await existingOrder.save()

        if (status === 'rejected') {
            await CheckoutService.cancelOrder({
                orderId,
                userId: existingOrder.order_userId
            })
        }

        return existingOrder;
    }


    static async listProductsForShop({
        orderId, userId
    }) {
        const listForRabbitMQ = await order.aggregate([
            {
                $match: { _id: convertToObjectIdMongoDb(orderId), order_userId: userId }
            },
            {
                $unwind: '$order_products',
            },
            {
                $unwind: '$order_products.item_products'
            },
            {
                $lookup: {
                    from: 'Products',
                    localField: 'order_products.item_products.productId',
                    foreignField: '_id',
                    as: 'productData'
                }
            },
            {
                $unwind: '$productData'
            },
            {
                $lookup: {
                    from: 'Inventories',
                    localField: 'order_products.item_products.productId',
                    foreignField: 'inven_productId',
                    as: 'inventoryData'
                }
            },
            {
                $unwind: '$inventoryData'
            },
            {
                $lookup: {
                    from: 'Shops',
                    localField: 'order_products.shopId',
                    foreignField: '_id',
                    as: 'shopData'
                }
            },
            {
                $unwind: '$shopData'
            },
            {
                $group: {
                    _id: '$order_products.shopId',
                    shopId: { $first: '$order_products.shopId' },
                    shopName: { $first: '$shopData.name' },
                    products: {
                        $push: {
                            productId: '$order_products.item_products.productId',
                            productName: '$productData.product_name',
                            quantity: '$order_products.item_products.quantity',
                            location: '$inventoryData.inven_location'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    shopId: 1,
                    shopName: 1,
                    products: 1
                }
            }
        ]);


        return listForRabbitMQ
    }

    static async listProductsForInven({
        orderId, userId
    }) {
        const listForInven = await order.aggregate([
            {
                $match: { _id: convertToObjectIdMongoDb(orderId), order_userId: userId }
            },
            {
                $unwind: '$order_products',
            },
            {
                $unwind: '$order_products.item_products'
            },
            {
                $group: {
                    _id: {
                        shopId: '$order_products.shopId',
                    },
                    products: {
                        $push: {
                            productId: '$order_products.item_products.productId',
                            price: '$order_products.item_products.price',
                            quantity: '$order_products.item_products.quantity',
                        }
                    }
                }
            },
            {
                $project: {
                    shopId: '$_id.shopId',
                    products: 1,
                    _id: 0
                }
            }
        ]);


        return listForInven;
    }


    // for version
    static async orderByUserV2({ shop_order_ids, cartId, userId, user_address = {}, user_payment = {} }) {
        const { shop_order_ids_new, checkout_order } = await CheckoutService.checkoutReview({ cartId, userId, shop_order_ids });
        const products = shop_order_ids_new.flatMap(order => order.item_products);
        const acquireProduct = [];

        for (let i = 0; i < products.length; i++) {
            const { productId, quantity } = products[i];
            const { key, uniqueValue } = await reservationInventoryV2({ productId, quantity, cartId });
            acquireProduct.push(key ? true : false);
            if (key) {
                await releaseLock(key, uniqueValue);
            }
        }


        if (acquireProduct.includes(false)) {
            throw new BadRequestError('Một số sản phẩm đã được cập nhật, vui lòng quay lại giỏ hàng...');
        }

        const newOrder = await order.create({
            order_userId: userId,
            order_checkout: checkout_order,
            order_shipping: user_address,
            order_payment: user_payment,
            order_products: shop_order_ids_new
        });

        if (newOrder) {

            for (let i = 0; i < products.length; i++) {
                const { productId, quantity } = products[i];
                await inventory.findOneAndUpdate(
                    {
                        inven_productId: productId,
                        'inven_reservations.cartId': cartId,
                        'inven_reservations.status': 'pending'
                    },
                    {
                        $inc: { inven_stock: -quantity },
                        $set: { 'inven_reservations.$.status': 'confirmed' }
                    }
                );
            }
        }

        return newOrder;
    }
    static async getOrdersByUser({ userId }) {
        const orders = await order.findAll(
            { order_userId: userId },
            'order_shipping order_products order_payment order_trackingNumber order_status ',
            { sort: { createdAt: 1 } }
        ).lean()
        return orders;
    }

    /*[User] */
    static async getOneOrderByUser({ userId, orderId }) {
        const orderResult = await order.findOne(
            {
                order_userId: userId,
                _id: convertToObjectIdMongoDb(orderId)
            },
            'order_shipping order_products order_payment order_trackingNumber order_status ',
            { sort: { createdAt: 1 } }
        ).lean();
        return orderResult;
    }

    /*[User] */
    static async cancelOrder({ orderId, userId }) {
        try {
            const existingOrder = await order.findOne({ _id: convertToObjectIdMongoDb(orderId), order_userId: userId });
            if (!existingOrder) {
                throw new BadRequestError('Order not found');
            }

            if (!['pending'].includes(existingOrder.order_status)) {
                throw new BadRequestError('Cannot cancel this order.');
            }

            existingOrder.order_status = 'cancelled';
            await existingOrder.save();


            await publishOrderCancelled({
                orderId, userId
            });

            const userAccount = await userModel.findOne({
                _id: convertToObjectIdMongoDb(existingOrder.order_userId)
            }).lean()

            //to user
            await sendMailCancelOrder({
                recipientName: userAccount.usr_email,
                orderId
            })
            return existingOrder;

        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    /*[Shop] */
    static async updateOrderStatus({ orderId, newStatus }) {
        try {
            const existingOrder = await order.findOne({ _id: convertToObjectIdMongoDb(orderId) });
            if (!existingOrder) {
                throw new BadRequestError('Order not found');
            }

            const isValidationStatus = ['success', 'shipping']
            if (!isValidationStatus.includes(newStatus)) {
                throw new BadRequestError('Order not found');
            }

            if (newStatus === 'success') {
                const payment = await Payment.findOne({
                    payment_orderId: orderId,
                    payment_status: 'COMPLETED'
                });
    
                if (!payment) {
                    throw new BadRequestError('Payment not completed');
                } else {
                    publishOrderSuccessed({
                        orderId
                    })
                }
            }

            existingOrder.order_status = newStatus;
            await existingOrder.save();

            const userAccount = await userModel.findOne({
                _id: convertToObjectIdMongoDb(existingOrder.order_userId)
            }).lean()

            if (newStatus === 'shipping') {
                const userEmail = userAccount.usr_email;
                await sendEmailOrderShipping({
                    email: userEmail,
                    orderId: existingOrder._id,
                    userName: userAccount.usr_name,
                    totalAmount: existingOrder.order_checkout.totalCheckout,
                    orderStatus: "shipping"
                })
            }


            return newStatus;

        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    /*đơn hàng mới */
    static async processOrder(message) {
        const { orderId, userId, order_trackingNumber } = message;
        try {

            const userAccount = await userModel.findOne({
                _id: convertToObjectIdMongoDb(userId)
            }).lean()

            // publish for user
            await publishNotification({
                type: 'order.created',
                data: {
                    order_trackingNumber: order_trackingNumber,
                    senderId: null,
                    receivedId: userId,
                    userName: userAccount.usr_name
                }
            });

            const listForRabbitMQ = await CheckoutService.listProductsForShop({ orderId, userId })
            for (const item of listForRabbitMQ) {
                await publishNotification({
                    type: 'shop.new_order',
                    data: {
                        receivedId: item.shopId,
                        shopName: item.shopName,
                        products: item.products,
                        senderId: userId,
                        userName: userAccount.usr_name
                    }
                });
            }



        } catch (error) {
            console.error(`Error in processOrder for Order ID: ${orderId}`, error);
            throw new BadRequestError(error)
        }
    }

    static async processOrderCancelled(payload) {
        const { orderId, userId } = payload;

        try {
            const existingOrder = await order.findById(orderId);
            if (!existingOrder) {
                throw new NotFoundError('Order not found');
            }

            existingOrder.order_status = 'cancelled';
            await existingOrder.save();

            const userAccount = await userModel.findOne({
                _id: convertToObjectIdMongoDb(existingOrder.order_userId)
            }).lean()

            await publishNotification({
                type: 'order.cancelled',
                data: {
                    senderId: null,
                    order_trackingNumber: existingOrder.order_trackingNumber,
                    receivedId: userId,
                    userName: userAccount.usr_name
                }
            });

            const listForRabbitMQ = await CheckoutService.listProductsForShop({ orderId: newOrder._id, userId })
            for (const item of listForRabbitMQ) {
                await publishNotification({
                    type: 'shop.order_cancelled',
                    data: {
                        receivedId: item.shopId,
                        shopName: item.shopName,
                        products: item.products,
                        senderId: userId,
                        userName: userAccount.usr_name
                    }
                });
            }


            await publishInventoryUpdate({
                listData: this.listProductsForInven({ orderId, userId })
            });

        } catch (error) {
            console.error(`Error processing order cancellation for Order ID: ${orderId}`, error);
            throw error;
        }
    }

    static async processOrderConfirmed(payload) {
        const { orderId, userId } = payload;
        try {
            await publishNotification({
                type: 'order.confirmed',
                data: {
                    senderId: null,
                    order_trackingNumber: existingOrder.order_trackingNumber,
                    receivedId: userId,
                    userName: userAccount.usr_name
                }
            });

        } catch (error) {
            console.error(`Error processing order confirmation for Order ID: ${orderId}`, error);
            throw error;
        }
    }

    // success order
    static async processOrderStatusUpdated(payload) {
        const { orderId } = payload;
        try {
            const existingOrder = await order.findById(orderId);
            if (!existingOrder) {
                throw new NotFoundError('Order not found');
            }
            const userAccount = await userModel.findOne({
                _id: convertToObjectIdMongoDb(existingOrder.order_userId)
            }).lean()
            const listShop = existingOrder.order_products;
            for (let i = 0; i < listShop.length; i++) {
                await publishNotification({
                    type: 'order_success',
                    data: {
                        senderId: null,
                        receivedId: listShop[i].shopId,
                        userId: existingOrder.order_userId,
                        userName: userAccount.usr_name
                    }
                });
            }

        } catch (error) {
            console.error(`Error processing order status update for Order ID: ${orderId}`, error);
            throw error;
        }
    }

}

module.exports = CheckoutService