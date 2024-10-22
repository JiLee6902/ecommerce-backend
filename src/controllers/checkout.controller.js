'use strict'

const { SuccessResponse } = require('../core/success.response');
const CheckoutService = require('../services/checkout.service');

class CheckoutController {

    checkoutReview = async (req, res, next) => {
        new SuccessResponse({
            message: 'Checkout review success',
            metadata: await CheckoutService.checkoutReview(
                req.body
            )
        }).send(res);
    }

    getOneOrderByUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get one order success',
            metadata: await CheckoutService.getOneOrderByUser(
                {
                    orderId: req.params.orderId,
                    userId: req.params.userId
                }
            )
        }).send(res);
    }

    getOrdersByUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get orders success',
            metadata: await CheckoutService.getOrdersByUser(
                {
                    userId: req.params.userId
                }
            )
        }).send(res);
    }

    cancelOrder = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cancel order success',
            metadata: await CheckoutService.cancelOrder(
                {
                    orderId: req.params.orderId,
                    userId: req.params.userId
                }
            )
        }).send(res);
    }

    updateOrderStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update status order success',
            metadata: await CheckoutService.updateOrderStatus(
                {
                    orderId: req.params.orderId,
                    newStatus: req.body.status
                }
            )
        }).send(res);
    }
}

module.exports = new CheckoutController()