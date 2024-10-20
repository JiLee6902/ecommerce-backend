'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.response")
const { discount, deletedDiscount } = require("../models/discount.model")
const { findAllDiscountCodesUnSelect, checkDiscountExists } = require("../models/repositories/discount.repo")
const { findAllProducts } = require("../models/repositories/product.repo")
const { convertToObjectIdMongoDb, removeUndefinedObject } = require("../utils")

class DiscountService {
    static async createDiscountCode(payload) {
        const {
            code, start_date,
            end_date,
            is_active,
            shopId,
            min_order_value,
            applies_to,
            name,
            description,
            type,
            value,
            product_ids,
            users_used,
            max_uses,
            uses_count,
            max_uses_per_user
        } = payload


        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError("Discount code has expried!")
        }

        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongoDb(shopId)
        }).lean()

        if (foundDiscount && foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount exist!')
        }

        const newDiscount = await discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_value: value,
            discount_code: code,
            discount_start_date: new Date(start_date),
            discount_end_date: new Date(end_date),
            discount_max_uses: max_uses,
            discount_uses_count: uses_count,
            discount_users_used: users_used,
            discount_max_uses_per_user: max_uses_per_user,
            discount_min_order_value: min_order_value,
            discount_shopId: shopId,
            discount_is_active: is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to === 'all' ? [] : product_ids
        })
        return newDiscount;
    }

    static async updateDiscountCode(discountId, payload) {
        const obj = {
            discount_name: payload.name,
            discount_description: payload.description,
            discount_type: payload.type,
            discount_value: payload.value,
            discount_code: payload.code,
            discount_start_date: payload.start_date,
            discount_end_date: payload.end_date,
            discount_max_uses: payload.max_uses,
            discount_uses_count: payload.uses_count,
            discount_users_used: payload.users_used,
            discount_max_uses_per_user: payload.max_uses_per_user,
            discount_min_order_value: payload.min_order_value,
            discount_shopId: payload.shopId,
            discount_is_active: payload.is_active,
            discount_applies_to: payload.applies_to,
            discount_product_ids: payload.applies_to === 'all' ? [] : payload.product_ids
        }
        const cleanPayload = removeUndefinedObject(obj)
        const { start_date, end_date } = cleanPayload;

        if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
            throw new BadRequestError("Discount code has expried!")
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError("Discount code has expried!")
        }

        const foundDiscount = await discount.findOne({
            discount_code,
            discount_shopId: convertToObjectIdMongoDb(discount_shopId)
        }).lean();
        if (!foundDiscount && !foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount not exist!')
        }

        const updatedDiscount = await discount.findByIdAndUpdate(discountId, {
            cleanPayload
        }, { new: true })

        return updatedDiscount;
    }

    // QUERY
    /*
    Get all discount code available with products
     */
    static async getAllDiscountCodesWithProduct({
        code, shopId, limit, page
    }) {
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongoDb(shopId)
        }).lean();
        if (!foundDiscount && !foundDiscount.discount_is_active) {
            throw new NotFoundError('Discount not exist!')
        }

        const { discount_applies_to, discount_product_ids } = foundDiscount
        let filter = {
            product_shop: convertToObjectIdMongoDb(shopId),
            isPublished: true,
        };

        if (discount_applies_to === 'specific') {
            filter._id = { $in: discount_product_ids };
        }

        const products = await findAllProducts({
            filter,
            limit: +limit,
            page: +page,
            sort: 'ctime',
            select: ['product_name']
        });

        return products;
    }

    /*
    Get all discount code available of Shop
     */

    static async getAllDiscountCodesByShop({
        limit, page, shopId }
    ) {
        const discounts = await findAllDiscountCodesUnSelect({
            limit: +limit,
            page: +page,
            filter: {
                discount_shopId: convertToObjectIdMongoDb(shopId),
                discount_is_active: true,
            },
            unSelect: ['__v', 'discount_shopId', 'discount_is_active'],
            model: discount
        })

        return discounts;
    }


    /*
    Get discount_code amount
     */
    static async getDiscountAmount({ codeId, userId, shopId, products }) {
        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongoDb(shopId)
            }
        })

        if (!foundDiscount) throw new NotFoundError(`Discount doesn't exist!`)

        const {
            discount_is_active,
            discount_max_uses,
            discount_min_order_value,
            discount_max_uses_per_user,
            discount_users_used,
            discount_start_date,
            discount_min_uses_per_user,
            discount_value,
            discount_end_date,
            discount_product_ids,
            discount_type
        } = foundDiscount;

        if (!discount_is_active) throw new BadRequestError('Discount expried!')
        if (!discount_max_uses) throw new BadRequestError('Discount expried!')





        let totalOrder = 0;
        let amountItem = 0;
        if (discount_min_order_value > 0) {
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)


            if (totalOrder < discount_min_order_value) {
                throw new NotFoundError(`Discount require a minium order value of ${discount_min_uses_per_user}!`)
            }
        }


        if (discount_max_uses_per_user > 0) {
            const userUserDiscount = discount_users_used.find(user => user === userId);
          
        }



        const amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)

        products.forEach(product => {

            const checkProduct = discount_product_ids.some(e => e === product.productId);
            if (!checkProduct) {
                amountItem = (product.quantity * product.price) * (discount_value / 100)
            }

        })
        return {
            totalOrder,
            discount: amountItem != 0 ? amount - amountItem : amount,
            totalPrice: totalOrder - amount
        }

    }

    static async deleteDiscountCode({ shopId, codeId }) {
        const deleted = await discount.findOneAndDelete({
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongoDb(shopId)

        })
        return deleted;
    }

    // DELETE V2 //
    static async deleteDiscountCodeV2({ shopId, codeId }) {
        const discountToDelete = await checkDiscountExists({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongoDb(shopId)
            }
        })

        if (!discountToDelete) {
            throw new NotFoundError('Discount not found');
        }

        await deletedDiscount.create({
            discount_name: discountToDelete.discount_name,
            discount_description: discountToDelete.discount_description,
            discount_type: discountToDelete.discount_type,
            discount_value: discountToDelete.discount_value,
            discount_code: discountToDelete.discount_code,
            discount_start_date: discountToDelete.discount_start_date,
            discount_end_date: discountToDelete.discount_end_date,
            discount_max_uses: discountToDelete.discount_max_uses,
            discount_uses_count: discountToDelete.discount_uses_count,
            discount_users_used: discountToDelete.discount_users_used,
            discount_max_uses_per_user: discountToDelete.discount_max_uses_per_user,
            discount_min_order_value: discountToDelete.discount_min_order_value,
            discount_shopId: discountToDelete.discount_shopId,
            discount_is_active: discountToDelete.discount_is_active,
            discount_applies_to: discountToDelete.discount_applies_to,
            discount_product_ids: discountToDelete.discount_product_ids
        });

        await discount.findByIdAndRemove(discountId);
        return { message: 'Discount deleted and moved to archive' };
    }

    // END DELETE V2 //

    /*
    Cancel Discount Code
     */
    static async cancelDiscountCode({ codeId, shopId, userId }) {
        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongoDb(shopId)
            }
        })
        if (!foundDiscount) throw new NotFoundError(`Discount doesn't exist!`)

        const result = await discount.findByIdAndUpdate(
            foundDiscount._id,
            {
                $pull: {
                    discount_users_used: userId
                },
                $inc: {
                    discount_max_uses: 1,
                    discount_uses_count: -1
                }
            }, {

        })
        return result;
    }
    // END QUERY

}

module.exports = DiscountService