'use strict'

const ProductService = require('../services/product.service')
const ProductServiceV2 = require('../services/product.service')



const { SuccessResponse } = require('../core/success.response')
const { newSpu, oneSpu } = require('../services/spu.service')
const { oneSku } = require('../services/sku.service')

class ProductController {

    // SPU, SKU //
    findOneSpu = async (req, res, next) => {
        try {
            const { product_id } = req.query;
            new SuccessResponse({
                message: 'Get one spu success',
                metadata: await oneSpu({
                    skp_id: product_id
                })
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    findOneSku = async (req, res, next) => {
        try {
            const { sku_id, product_id } = req.query;
            new SuccessResponse({
                message: 'Get one sku success',
                metadata: await oneSku({
                    sku_id, product_id
                })
            }).send(res)
        } catch (error) {
            next(error)
        }
    }

    createSpu = async (req, res, next) => {
        try {
            const spu = await newSpu({
                ...req.body,
                product_shop: req.user.userId
            })
            new SuccessResponse({
                message: 'Create spu success',
                metadata: spu
            }).send(res)
        } catch (error) {
            next(error)
        }
    }


    // END SPU, SKU //


    createProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Product success',
            metadata: await ProductServiceV2.createProduct(
                req.body.product_type, {
                ...req.body,
                product_shop: req.user.userId
            }
            )
        }).send(res);
    }

    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Product success',
            metadata: await ProductServiceV2.updateProduct(
                req.body.product_type, req.params.productId,
                {
                    ...req.body,
                    product_shop: req.user.userId
                }
            )
        }).send(res);
    }

    publishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Publish Product success',
            metadata: await ProductServiceV2.publishProductByShop(
                {
                    product_id: req.params.id,
                    product_shop: req.user.userId
                }
            )
        }).send(res);
    }

    unPublishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Unpublish Product success',
            metadata: await ProductServiceV2.unPublishProductByShop(
                {
                    product_id: req.params.id,
                    product_shop: req.user.userId
                }
            )
        }).send(res);
    }

    // QUERY
    /**
     * @desc
     * @param {*} req 
     * @return {JSON}
     */
    getAllDraftsForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Product success',
            metadata: await ProductServiceV2.findAllDraftsForShop(
                {
                    product_shop: req.user.userId,
                }
            )
        }).send(res);
    }

    getAllPublishForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Product success',
            metadata: await ProductServiceV2.findAllPublishForShop(
                {
                    product_shop: req.user.userId,

                }
            )
        }).send(res);
    }


    getListSearchProduct = async (req, res, next) => {
        const { keyword, limit, page, ...filterParams } = req.query;
        new SuccessResponse({
            message: 'Get list search Product success',
            metadata: await ProductServiceV2.searchProducts(keyword, {
                limit: parseInt(limit, 10) || 50,
                page: parseInt(page, 10) || 1,
                filter: { ...filterParams, isDraft: false, isPublished: true }
            })
        }).send(res);
    }

    getListSearchProductAndTopShop = async (req, res, next) => {
        const { keyword, limit, page } = req.query;
        new SuccessResponse({
            message: 'Get list search Product success',
            metadata: await ProductServiceV2.searchProductsAndTopShops(keyword, limit, page)
        }).send(res);
    }

    findAllProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Product for user success',
            metadata: await ProductServiceV2.findAllProducts(
                req.query
            )
        }).send(res);
    }

    findProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Product for user success',
            metadata: await ProductServiceV2.findProduct(
                { product_id: req.params.product_id }
            )
        }).send(res);
    }
    //END QUERY

}

module.exports = new ProductController()

