
'use strict'

const { NotFoundError } = require("../core/error.response")
const { findShopById } = require("../models/repositories/shop.repo")
const SPU_MODEL = require("../models/spu.model")
const { randomProductId } = require("../utils")
const { newSku, allSkuBySpuId } = require("./sku.service")

const newSpu = async ({
    product_id,
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_category,
    product_shop,
    product_attribute,
    product_quantity,
    product_variations,
    sku_list = []
}) => {
    try {
        const foundShop = await findShopById({
            shop_id: product_shop
        })

        if (!foundShop) {
            throw new NotFoundError('Shop not exist!')
        }

        const spu = await SPU_MODEL.create({
            product_id: randomProductId(),
            product_name,
            product_thumb,
            product_description,
            product_price,
            product_category,
            product_shop,
            product_attribute,
            product_quantity,
            product_variations,
        })

        if (spu && sku_list.length) {
            newSku({ sku_list, spu_id: spu.product_id }).then()
        }


        return spu;
    } catch (error) {
        console.error(error)
    }
}

const oneSpu = async ({spu_id}) => {
    try {
        const spu = await SPU_MODEL.findOne({
            product_id: spu_id,
            isPublished: false
        })

        if(!spu) {
            throw new NotFoundError("spu not found!")
        }

        const skus = await allSkuBySpuId({product_id: spu.product_id})

        return {
            spu_info: _.omit(spu, ['__v', 'updatedAt']),
            sku_list: skus.map(sku =>_.omit(sku, ['__v', 'updatedAt', 'createdAt', 'isDeleted']))
        }
    } catch (error) {
        return {}
    }
}

module.exports = {
    newSpu,
    oneSpu
}