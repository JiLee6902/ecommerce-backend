'use strict'

const { BadRequestError } = require('../core/error.response')
const { inventory } = require('../models/inventory.model')
const { getProductById } = require('../models/repositories/product.repo')

class InventoryService {
    static async addStockToInventory({
        stock,
        productId,
        shopId,
    }) {

        const product = await getProductById(productId)
        if (!product) throw new BadRequestError('The product does not exist!')

        const existingInventory = await inventory.findOne({ inven_shopId: shopId });
        const productInInventory = existingInventory.inven_products.find(p => p.inven_productId.toString() === productId.toString());

        if (productInInventory) {
            productInInventory.inven_stock += stock; 
            await existingInventory.save();  
            return existingInventory;
        } else {
            const newProductInInventory = {
                inven_productId: productId,
                inven_stock: stock
            };
            existingInventory.products.push(newProductInInventory);
            await existingInventory.save();
            return existingInventory;
        }
    }


}

module.exports = InventoryService
