'use strict'

const { BadRequestError } = require('../core/error.response');
const { product, clothing, electronic, furniture } = require('../models/product.model');
const { insertInventory } = require('../models/repositories/inventory.repo');
const { findAllDraftsForShop, findProduct, findAllProducts, publishProductByShop, findAllPublishForShop, searchProductByUser, updateProductById } = require('../models/repositories/product.repo');
const { removeUndefinedObject, updateNestedObjectParser } = require('../utils');
const { pushNotiToSystem } = require('./notification.service');
const elasticsearchService = require('./elasticsearch.service');


class ProductFactory {

    static productRegistry = {} 
    static registerProductType(type, classRef) {
        ProductFactory.productRegistry[type] = classRef
    }

    static async createProduct(type, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) throw new BadRequestError(`Invalid Product Types ${type}`)

        const newProduct = await new productClass(payload).createProduct();
        await elasticsearchService.addProduct(newProduct);

        return newProduct;
    }

    static async updateProduct(type, productId, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) throw new BadRequestError(`Invalid Product Types ${type}`)

        const updateProduct = await new productClass(payload).updateProduct(productId);
        await elasticsearchService.updateProduct(product_id.toString(), updateProduct);

        return updateProduct;
    }


    // PUT //
    //from darft to publish
    static async publishProductByShop({ product_shop, product_id }) {
        const result = await publishProductByShop({ product_shop, product_id });
        if (result) {
            await elasticsearchService.updateProduct(product_id.toString(), { isPublished: true });
        }
        return result;
    }

    static async unPublishProductByShop({ product_shop, product_id }) {
        const result = await unPublishProductByShop({ product_shop, product_id });
        if (result) {
            await elasticsearchService.updateProduct(product_id.toString(), { isPublished: false });
        }
        return result;
    }

    // END PUT //

    // QUERY //
    //FOR SHOP
    static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
        const query = { product_shop, isDraft: true }
        return await findAllDraftsForShop({ query, limit, skip })
    }


    static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
        const query = { product_shop, isPublished: true }
        return await findAllPublishForShop({ query, limit, skip })
    }
    //END FOR SHOP

    static async searchProducts(keyword, { filter, limit = 50, page = 1 }) {
        const { products, total } = await elasticsearchService.searchProducts(keyword, filter, (page - 1) * limit, limit);
        return {
            products,
            total,
            page,
            limit
        };
    }

    static async searchProductsAndTopShops(keyword,  limit = 50, page = 1 ) {
        const { products, topShops, total } = await elasticsearchService.searchProductsAndTopShops(
            keyword,
            {
                from: (page - 1) * limit,
                size: limit
            });

        return {
            products,
            topShops,
            total,
            page,
            limit
        };
    }

    //homepage | user
    static async findAllProducts({ limit = 50, sort = 'ctime', page = 1, filter = { isPublished: true } }) {
        return await findAllProducts({
            limit, sort, page, filter,
            select: ['product_name', 'product_price', 'product_thumb', 'product_shop']
        })
    }

    //details
    static async findProduct({ product_id }) {
        return await findProduct({
            product_id,
            unselect: ['__v']
        })
    }

    // END QUERY //

}

class Product {
    constructor({
        product_name,
        product_thumb,
        product_description,
        product_price,
        product_quantity,
        product_type,
        product_shop,
        product_attributes
    }) {
        this.product_name = product_name;
        this.product_thumb = product_thumb;
        this.product_description = product_description;
        this.product_price = product_price;
        this.product_quantity = product_quantity;
        this.product_type = product_type;
        this.product_shop = product_shop;
        this.product_attributes = product_attributes;
    }

    async createProduct(product_id) {
        const newProduct = await product.create({ ...this, _id: product_id })
        if (newProduct) {
            await insertInventory({
                productId: newProduct._id,
                shopId: this.product_shop,
                stock: this.product_quantity
            })

            pushNotiToSystem({
                type: 'SHOP-001',
                receivedId: 1,
                senderId: this.product_shop,
                options: {
                    product_name: this.product_name,
                    shop_name: this.product_shop
                }
            }).then(re => console.log(re))
                .catch(console.error)
        }


        return newProduct;
    }
    async updateProduct(productId, bodyUpdate) {
        return await updateProductById({ productId, bodyUpdate, model: product })
    }
}


//define subclass by type clothing
class Clothing extends Product {

    async createProduct() {
        const newClothing = await clothing.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        })

        if (!newClothing) throw new BadRequestError('Create new Clothing error')

        const newProduct = await super.createProduct(newClothing._id);
        if (!newProduct) throw new BadRequestError('Create new Product error')

        return newProduct;
    }

    async updateProduct(productId) {
        //remove null and underdined
        const objectParams = this;
        if (objectParams.product_attributes) {
            await updateProductById({ productId, objectParams, model: clothing })
        }
        console.log("objectParams", objectParams);
        console.log("This:", this);

        const updateProduct = await super.updateProduct(productId, objectParams)
        return updateProduct
    }
}

class Electronics extends Product {

    async createProduct() {
        const newElectronic = await electronic.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        })
        if (!newElectronic) throw new BadRequestError('Create new Electronic error')

        const newProduct = await super.createProduct(newElectronic._id);
        if (!newProduct) throw new BadRequestError('Create new Product error')

        return newProduct;
    }

    async updateProduct(productId) {
        //remove null and underdined
        const objectParams = this;
        if (objectParams.product_attributes) {
            await updateProductById({ productId, objectParams, model: electronic })
        }

        const updateProduct = await super.updateProduct(productId, objectParams)
        return updateProduct
    }
}


class Furniture extends Product {

    async createProduct() {
        const newFurniture = await furniture.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        })
        if (!newFurniture) throw new BadRequestError('Create new Furniture error')

        const newProduct = await super.createProduct(newFurniture._id);
        if (!newProduct) throw new BadRequestError('Create new Product error')

        return newProduct;
    }
    async updateProduct(productId) {
        //remove null 
        const objectParams = removeUndefinedObject(this);
        if (objectParams.product_attributes) {
            await updateProductById({
                productId,

                bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
                model: furniture
            })
        }

        const updateProduct = await super.updateProduct(
            productId,
            updateNestedObjectParser(objectParams),
        )
        return updateProduct
    }
}

ProductFactory.registerProductType('Electronics', Electronics)
ProductFactory.registerProductType('Furniture', Furniture)
ProductFactory.registerProductType('Clothing', Clothing)



module.exports = ProductFactory