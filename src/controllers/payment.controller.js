'use strict'

const { SuccessResponse } = require('../core/success.response');
const PaymentService = require('../services/payment.service');

class PaymentController {
    createPaymentUrl = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create Payment URL success',
            metadata: await PaymentService.createPaymentUrl({
                orderId: req.body.orderId,
                userId: req.user.userId,
                ipAddr: req.ip
            })
        }).send(res);
    }

    vnpayReturn = async (req, res, next) => {
        new SuccessResponse({
            message: 'Process VNPay return success',
            metadata: await PaymentService.vnpayReturn(
                req.query
            )
        }).send(res);
    }

    getPaymentById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Payment success',
            metadata: await PaymentService.getPaymentById(
                req.params.paymentId
            )
        }).send(res);
    }

    getPaymentsByOrder = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Payments by Order success',
            metadata: await PaymentService.getPaymentsByOrder(
                req.params.orderId
            )
        }).send(res);
    }
}

module.exports = new PaymentController()