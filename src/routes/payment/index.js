'use strict'

const express = require('express');
const asyncHandler = require('../../helpers/asyncHandler');
const PaymentController = require('../../controllers/payment.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

router.get('/vnpay_return', asyncHandler(PaymentController.vnpayReturn))

router.use(authenticationV2)
router.post('/create_payment_url', asyncHandler(PaymentController.createPaymentUrl))
router.get('/payment/:paymentId', asyncHandler(PaymentController.getPaymentById))
router.get('/order/:orderId/payments', asyncHandler(PaymentController.getPaymentsByOrder))

module.exports = router;