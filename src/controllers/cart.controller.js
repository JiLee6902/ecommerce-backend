'use strict'






const { SuccessResponse } = require('../core/success.response');
const CartService = require('../services/cart.service');


class CartController {

    /**
     * @desc add to cart for user
     * @param {int} userId
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @method POST
     * @url /v1/api/cart/user
     * @return {
     * }
     */
    addToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Upsert Cart success',
            metadata: await CartService.addToCart(
                req.body
            )
        }).send(res);
    }

    addToCartV2 = async (req, res, next) => {
        new SuccessResponse({
            message: 'Upsert Cart success',
            metadata: await CartService.addToCartV2(
                req.body
            )
        }).send(res);
    }

    update = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Cart success',
            metadata: await CartService.addToCartV2(
                req.body
            )
        }).send(res);
    }

    delete = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete Cart success',
            metadata: await CartService.deleteUserCart(
                {
                    ...req.body
                }
            )
        }).send(res);
    }

    listToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Cart with User success',
            metadata: await CartService.getListUserCart(               
                req.query   
            )
        }).send(res);
    }
}

module.exports = new CartController()