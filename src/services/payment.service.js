'use strict'

const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const Payment = require('../models/payment.model');
const { convertToObjectIdMongoDb } = require('../utils');

class PaymentService {
    static config = {
        vnp_TmnCode: "DQJB5H2K",
        vnp_HashSecret: "65T69XHRJHIY4Q5MMNALHBYWDVVK5SYH",
        vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        vnp_ReturnUrl: "http://localhost:3000/v1/api/payment/vnpay_return"
    }

    static async createPaymentUrl({ orderId, userId, ipAddr }) {
        const existingOrder = await order.findOne({
            _id: convertToObjectIdMongoDb(orderId),
            order_userId: convertToObjectIdMongoDb(userId)
        });

        if (!existingOrder) {
            throw new BadRequestError('Order not found');
        }

        // Create payment record
        const payment = await Payment.create({
            payment_userId: userId,
            payment_orderId: orderId,
            payment_amount: existingOrder.order_checkout.totalCheckout,
            payment_method: 'VNPAY'
        });

        const tmnCode = PaymentService.config.vnp_TmnCode;
        const secretKey = PaymentService.config.vnp_HashSecret;
        let vnpUrl = PaymentService.config.vnp_Url;
        const returnUrl = PaymentService.config.vnp_ReturnUrl;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');

        const orderId = moment(date).format('DDHHmmss');
        const amount = existingOrder.order_checkout.totalCheckout;
        let locale = 'vn';

        const currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;


        vnp_Params = PaymentService.sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        return {
            paymentUrl: vnpUrl,
            paymentId: payment._id
        };
    }

    static async vnpayReturn(vnpayResponse) {
        const secureHash = vnpayResponse['vnp_SecureHash'];
        delete vnpayResponse['vnp_SecureHash'];
        delete vnpayResponse['vnp_SecureHashType'];

        vnpayResponse = PaymentService.sortObject(vnpayResponse);

        const signData = querystring.stringify(vnpayResponse, { encode: false });
        const hmac = crypto.createHmac("sha512", PaymentService.config.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnpayResponse['vnp_TxnRef'];
            const rspCode = vnpayResponse['vnp_ResponseCode'];

            const payment = await Payment.findOneAndUpdate(
                { payment_orderId: orderId },
                {
                    payment_status: rspCode === '00' ? 'COMPLETED' : 'FAILED',
                    payment_response: vnpayResponse,
                    payment_transaction_id: vnpayResponse['vnp_TransactionNo'],
                    payment_time: new Date()
                },
                { new: true }
            );

            return {
                code: vnpayResponse['vnp_ResponseCode'],
                message: 'success',
                data: payment
            }
        } else {
            throw new BadRequestError('Invalid signature');
        }
    }

    static sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();

        keys.forEach(key => {
            sorted[key] = obj[key];
        });

        return sorted;
    }

    static async getPaymentById(paymentId) {
        const paymentData = await Payment.findOne({
            _id: convertToObjectIdMongoDb(paymentId)
        }).lean().exec()
        return paymentData
    }

    static async getPaymentsByOrder(orderId) {
        const paymentData = await Payment.findOne({
            payment_orderId: convertToObjectIdMongoDb(orderId)
        }).lean().exec()
        return paymentData
    }
}

module.exports = PaymentService;
