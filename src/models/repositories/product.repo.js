'use strict'

const { BadRequestError } = require('../../core/error.response')
const { product, electronic, furniture, clothing } = require('../../models/product.model')
const { Types } = require('mongoose')
const { getSelectData, unGetSelectData, convertToObjectIdMongoDb } = require('../../utils')

const queryProduct = async ({ query, limit, skip }) => {
    return await product.find(query)
        .populate('product_shop', 'name email -_id')
        .sort({ updateAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()
}


const findProductsByShopName = async (shopName) => {
    try {
       
        const products = await Product.product.find()
            .populate({
                path: 'product_shop', 
                match: { name: shopName }, 
                select: 'name' 
            })
            .exec();

        const filteredProducts = products.filter(p => p.product_shop);

        return filteredProducts;

    } catch (error) {
        console.error('Error finding products by shop name:', error);
    }
};


const findAllDraftsForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
}

const findAllPublishForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
}


const searchProductByUser = async ({ keySearch }) => {
    const regexSearch = new RegExp(keySearch)
    const results = await product
        .find({
            isPublished: true,
            $text: { $search: regexSearch }
        }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).lean()
    return results;
}


const publishProductByShop = async ({ product_shop, product_id }) => {
    try {
        const shopId = new Types.ObjectId(product_shop);
        const productId = new Types.ObjectId(product_id);

        const result = await product.findByIdAndUpdate(
            { _id: productId, product_shop: shopId },
            { $set: { isDraft: false, isPublished: true } },
            { new: true }
        );
        if (!result) {
            return null;
        }
        return 1;
    } catch (error) {
        throw new BadRequestError("Failed to publish product");
    }
}


const unPublishProductByShop = async ({ product_shop, product_id }) => {
    try {
        const shopId = new Types.ObjectId(product_shop);
        const productId = new Types.ObjectId(product_id);

        const result = await product.findByIdAndUpdate(
            { _id: productId, product_shop: shopId },
            { $set: { isDraft: true, isPublished: false } },
            { new: true }
        );
        if (!result) {
            return null;
        }
        return 1;
    } catch (error) {
        throw new BadRequestError("Failed to unpublish product");
    }
}

const findAllProducts = async ({ limit, sort, page, filter, select }) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
    const products = await product
        .find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(getSelectData(select))
        .lean()
    return products
}

const findProduct = async ({ product_id, unselect }) => {

    return await product
        .findById(product_id)
        .select(unGetSelectData(unselect))
        .lean()

}

const updateProductById = async ({
    productId,
    bodyUpdate,
    model,
    isNew = true
}) => {
    return await model.findByIdAndUpdate(productId, bodyUpdate, {
        new: isNew
    })
}

const getProductById = async (productId) => {
    return await product.findOne({ _id: convertToObjectIdMongoDb(productId) }).lean()
}

const checkProductByServer = async (products) => {
    return await Promise.all(
        products.map(async product => {
            try {
                const foundProduct = await getProductById(product.productId)


                if (foundProduct) {
                    return {
                        price: foundProduct.product_price,
                        quantity: product.quantity,
                        productId: product.productId
                    }
                } else {
                    throw new BadRequestError("Not found Product!")
                }
            } catch (error) {
                console.error(`Error fetching product ${product.productId}:`, error);
                return null;
            }
        })
    )
}

module.exports = {
    findAllDraftsForShop,
    publishProductByShop,
    findAllPublishForShop,
    unPublishProductByShop,
    searchProductByUser,
    findAllProducts,
    findProduct,
    updateProductById,
    getProductById,
    checkProductByServer
}