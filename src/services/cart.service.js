'use strict'

const { NotFoundError } = require("../core/error.response");
const { cart } = require("../models/cart.model");
const { getCacheIO, setCacheIO, delCacheIO } = require("../models/repositories/cache.repo");
const { getProductById } = require("../models/repositories/product.repo");


const CART_PREFIX = 'cart-';

class CartService {

    static getCartKey(userId) {
        return `${CART_PREFIX}${userId}`;
    }

    static async getCartFromCache(userId) {
        const cacheKey = await CartService.getCartKey(userId);
        const cachedCart = await getCacheIO({ key: cacheKey })

        if (cachedCart) {
            return JSON.parse(cachedCart)
        }

        const userCart = await cart.findOne({
            cart_userId: userId,
            cart_state: 'active'
        });

        if (userCart) {
            await setCacheIO({
                key: cacheKey,
                value: JSON.stringify(userCart),
                expirationInSeconds: 3600 * 24
            });
        }

        return userCart;
    }

    static async updateCartCache(userId, cartData) {
        const cacheKey = await CartService.getCacheKey(userId);
        await setCacheIO({
            key: cacheKey,
            value: JSON.stringify(cartData),
            expirationInSeconds: 3600
        })
    }


    // START REPO CART //
    static async createUserCart({ userId, product }, session) {
        const query = { cart_userId: userId, cart_state: 'active' },
            updateOrInsert = {
                $addToSet: {
                    cart_products: product
                }
            }, options = { upsert: true, new: true }

        const newCart = await cart.findOneAndUpdate(query, updateOrInsert, options).session(session);
        await CartService.updateCartCache(userId, newCart)

        return newCart;
    }

    //update v1 (khi thêm sản phẩm từ trang sản phẩm)
    static async updateUserCartQuantity({ userId, product }, session) {
        let userCart = await CartService.getCartFromCache(userId);

        const { productId, quantity, shopId, price, name } = product;

        if (!userCart) {
            throw new BadRequestError("Cart not found");
        }
        /*
         cart_products:[
                         {
                           productId,
                           shopId,
                           quantity,
                           name,
                           price
                         },
                         {
                           productId,
                           shopId,
                           quantity,
                           name,
                           price
                        }
                       ]

         */
        const query = {
            cart_userId: userId,
            'cart_products.productId': productId,
            cart_state: 'active'
        }, updateSet = {
            $inc: {       
                'cart_products.$.quantity': quantity
            }
        }, options = { upsert: true, new: true, session }

        const productIndex = userCart.cart_products.findIndex(p => p.productId.toString() === productId);
        let updatedCart;
        if (productIndex === -1) {
            updatedCart = await cart.findOneAndUpdate(
                { cart_userId: userId, cart_state: 'active' },
                {
                    $addToSet: {
                        cart_products: {
                            productId,
                            shopId,
                            quantity,
                            name,
                            price
                        }
                    }
                },
                { new: true, session }
            );
        } else {
            const existingProduct = userCart.cart_products[productIndex];
            const newQuantity = existingProduct.quantity + quantity;

            if (newQuantity < 0) {
                throw new BadRequestError("Insufficient quantity in cart");
            }
            updatedCart = await cart.findOneAndUpdate(query, updateSet, options)
        }
        await CartService.updateCartCache(userId, updatedCart);
        return updatedCart;
    }
    // END REPO CART //

    static async addToCart({ userId, product = {} }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userCart = await CartService.getCartFromCache(userId);
            if (!userCart) {
                await CartService.createUserCart({ userId, product }, session);
            } else {
                await CartService.updateUserCartQuantity({ userId, product }, session);
            }

            await session.commitTransaction();
            session.endSession();

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    //updatev2 (update trong chính giỏ hàng)
    /* 
      shop_order_ids : [
        {
            shopId,
            shop_discount: [
                       {
                           shopId,
                           discountId, 
                           codeId
                       }
                   ],
            item_products: [
                {
                    quantity,
                    price,
                    shopId,
                    old_quantity, 
                    productId
                }
            ],
            version
        }
      ]
    */
    static async addToCartV2({ userId, shop_order_ids }) {
        const { productId, quantity, old_quantity } = shop_order_ids[0]?.item_products[0]
        const foundProduct = await getProductById(productId)


        if (!foundProduct) throw new NotFoundError('');
        if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) throw new NotFoundError;

        const updatedCart = await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - old_quantity
            }
        })
        await CartService.updateCartCache(userId, updatedCart);
        return updatedCart;
    }

    //REMOVE FROM CART
    static async deleteUserCart({ userId, productId }) {
        const currentCart = await CartService.getCartFromCache(userId);
        if (!currentCart) {
            throw new NotFoundError('Cart not found');
        }

        const query = { cart_userId: userId, cart_state: "active" },
            updateSet = {
                $pull: {
                    cart_products: {
                        productId: productId
                    },
                }
            }

        const deleteCart = await cart.updateOne(query, updateSet);
        await CartService.updateCartCache(userId, deleteCart);
        return deleteCart;
    }

    static async getListUserCart({ userId }) {
        return await CartService.getCartFromCache(userId);
    }

}

module.exports = CartService