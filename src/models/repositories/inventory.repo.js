const { BadRequestError } = require("../../core/error.response")
const { convertToObjectIdMongoDb } = require("../../utils")
const { inventory } = require("../inventory.model")
const { Types } = require('mongoose')
const { product } = require("../product.model")
const elasticsearchService = require("../../services/elasticsearch.service")
const shopSaleModel = require("../shopSale.model")


const insertInventory = async ({
    shopId
}) => {
    return await inventory.create({
        inven_shopId: shopId
    })
}

// when user oder
const reservationInventory = async ({ productId, quantity, cartId, shopId }) => {
    const existingInventory = await inventory.findOne({ inven_shopId: shopId });
    if (!existingInventory) {
        throw new BadRequestError('Inventory not found for the specified shop.');
    }

    const productInInven = existingInventory.inven_products.find(product => {
        product.inven_productId.toString() === productId.toString()

    })


    if (!productInInven || productInInven.inven_stock < quantity) {
        throw new BadRequestError('Insufficient stock or product not found in the inventory.');
    }

    productInInven.inven_stock -= quantity;
    existingInventory.inven_reservations.push({
        quantity,
        cartId,
        createOn: new Date()
    });

    await existingInventory.save();

    // start elastic search
    const updatedProduct = await product.findOneAndUpdate(
        { _id: convertToObjectIdMongoDb(productId) },
        {
            $inc: {
                total_sales_count: quantity
            }
        },
        {
            new: true
        }
    );
    await elasticsearchService.updateProduct(productId.toString(), {
        total_sales_count: updatedProduct.total_sales_count
    })

    const existShop = await shopSaleModel.findOne(
        { product_id: productId, shop_id: shopId })

    if (!existShop) {
        const shopSale = await shopSaleModel.create({
            shop_id: shopId,
            product_id: productId,
            sales_count: quantity
        })
        await elasticsearchService.addShopSales(shopSale)
    } else {
        existShop.sales_count += quantity
        const updateShopSale = await existShop.save();

        await elasticsearchService.updateShopSale(shopId.toString(), productId.toString(), {
            sales_count: updateShopSale.sales_count
        })
    }
    // end elastic search

    return existingInventory;
}

// cancel order
const updateInventory = async ({ data }) => {

    const updatePromises = data.map(async (item) => {
        await publishNotification({
            type: 'shop.inventory_updated',
            data: {
                receivedId: item.shopId,
                products: item.products,
                senderId: null,
            }
        });

        const inventoryData = await inventory.findOne({ inven_shopId: item.shopId });
        if (!inventoryData) {
            throw new BadRequestError('Inventory not found for the specified shop.');
        }

        const productUpdatePromises = item.products.map(async (productItem) => {
            const productInInven = inventoryData.inven_products.find(product => {
                product.inven_productId.toString() === productItem.productId.toString()
            })

            productInInven.inven_stock += productItem.quantity;
            await Promise.all(productUpdatePromises);
            await inventoryData.save();

            // start elastic search
            const updatedProduct = await product.findOneAndUpdate(
                { _id: convertToObjectIdMongoDb(productInInven._id) },
                {
                    $inc: {
                        total_sales_count: - quantity
                    }
                },
                {
                    new: true
                }
            );
            await elasticsearchService.updateProduct(productInInven._id.toString(), {
                total_sales_count: updatedProduct.total_sales_count
            })

            const existShop = await shopSaleModel.findOne(
                { product_id: productInInven._id, shop_id: item.shopId })

            existShop.sales_count -= quantity
            const updateShopSale = await existShop.save();

            await elasticsearchService.updateShopSale(item.shopId.toString(), productInInven._id.toString(), {
                sales_count: updateShopSale.sales_count
            })
            // end elastic search
        })
    });

    const updateResults = await Promise.all(updatePromises);
    return updateResults;
}


module.exports = {
    insertInventory,
    reservationInventory,
    updateInventory
}