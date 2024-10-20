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
        const { userId, orderId } = req.query;
        new SuccessResponse({
            message: 'Get one order success',
            metadata: await CheckoutService.getOneOrderByUser(
                userId, orderId
            )
        }).send(res);
    }

    getOrdersByUser = async (req, res, next) => {
        const { userId } = req.query;
        new SuccessResponse({
            message: 'Get orders success',
            metadata: await CheckoutService.getOrdersByUser(
                userId
            )
        }).send(res);
    }

    cancelOrder = async (req, res, next) => {
        const { userId, orderId } = req.body;
        new SuccessResponse({
            message: 'Cancel order success',
            metadata: await CheckoutService.cancelOrder(
                userId, orderId
            )
        }).send(res);
    }

    updateOrderStatus = async (req, res, next) => {
        const { orderId } = req.query;
        const {newStatus } = req.body;
        new SuccessResponse({
            message: 'Update status order success',
            metadata: await CheckoutService.updateOrderStatus(
                orderId, newStatus
            )
        }).send(res);
    }
}

module.exports = new CheckoutController()