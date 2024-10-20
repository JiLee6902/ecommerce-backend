

'use strict'

const SKU_MODEL = require("../models/sku.model")
const SPU_MODEL = require("../models/spu.model")

const { randomProductId } = require("../utils")
const _ = require('lodash')
const { CACHE_PRODUCT } = require('../configs/constant')
const { getCacheIO, setCacheIO, setCacheIOExpiration } = require('../models/repositories/cache.repo')


const newSku = async ({
    spu_id, sku_list
}) => {
    try {
        const conver_sku_list = sku_list.map(sku => {
            return { ...sku, product_id: spu_id, sku_id: `${spu_id}.${randomProductId()}` }
        })
        const skus = await SKU_MODEL.create(conver_sku_list)
        return skus
    } catch (error) {
        console.error(error)
    }
}

const oneSku = async ({ sku_id, product_id }) => {
    try {
        const skuKeyCache = `${CACHE_PRODUCT.SKU}${sku_id}`;

        const skuFromDb = await SKU_MODEL.findOne({
            sku_id, product_id
        }).lean();

        const valueCache = skuFromDb ? skuFromDb : null;

        setCacheIOExpiration({
            key: skuKeyCache,
            value: JSON.stringify(valueCache),
            expirationInSeconds: 30
        }).then();
        return {
            skuFromDb,
            toLoad: 'dbs'
        };

    } catch (error) {
        console.error(error);
        return null;
    }
};


const allSkuBySpuId = async ({ product_id }) => {
    try {
        const skus = await SKU_MODEL.find({ product_id }).lean()
        return skus;
    } catch (error) {
        console.error(error)
        return null;
    }
}


const getSkuAttributesList = async () => {
    try {
        const skuAttributesList = await SKU_MODEL.aggregate([ 
            {
                $lookup: {
                    from: 'Spus',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'spu'
                }
            },
            {
                $unwind: '$spu'
            },
            {
                $project: {
                    sku_id: 1,
                    sku_tier_idx: 1,
                    spu_variations: '$spu.product_variations'
                }
            },
            {
                $addFields: {
                    attributes: {
                        $map: {
                            input: { $range: [0, { $size: '$sku_tier_idx' }] },
                            as: 'idx',
                            in: {
                                $arrayElemAt: [
                                    { $arrayElemAt: ['$spu_variations.options', '$$idx'] },
                                    { $arrayElemAt: ['$sku_tier_idx', '$$idx'] }
                                ]                            
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    sku_id: 1,
                    attributes: {
                        $reduce: {
                            input: '$attributes',
                            initialValue: '',
                            in: {
                                $concat: [
                                    '$$value',
                                    { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                                    '$$this'
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        return skuAttributesList;
    } catch (error) {
        console.error('Error fetching SKU attributes list:', error);
        return [];
    }
};


module.exports = {
    newSku,
    oneSku,
    allSkuBySpuId,
    getSkuAttributesList
}
