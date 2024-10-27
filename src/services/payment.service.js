'use strict'

const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const Payment = require('../models/payment.model');
const order = require('../models/order.model');

const { convertToObjectIdMongoDb } = require('../utils');

class PaymentService {
    static config = {
        vnp_TmnCode: "DQJB5H2K",
        vnp_HashSecret: "65T69XHRJHIY4Q5MMNALHBYWDVVK5SYH",
        vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        vnp_ReturnUrl: "http://localhost:3000/v1/api/payment/vnpay_return",
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_CurrCode: "VND"
    }

    static async createPaymentUrl({ orderId, userId, ipAddr }) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const existingOrder = await order.findOne({
                _id: convertToObjectIdMongoDb(orderId),
                order_userId: convertToObjectIdMongoDb(userId)
            });

            if (!existingOrder) {
                throw new BadRequestError('Order not found');
            }

            const amount = existingOrder.order_checkout.totalCheckout;
            if (!amount || amount <= 0) {
                throw new BadRequestError('Invalid payment amount');
            }

            if (!ipAddr || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddr)) {
                throw new BadRequestError('Invalid IP address');
            }


            const payment = await Payment.create([{
                payment_userId: userId,
                payment_orderId: orderId,
                payment_amount: amount,
                payment_method: 'VNPAY',
                payment_status: 'PENDING'
            }], { session });


            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const vnpTxnRef = `${moment(date).format('YYYYMMDDHHmmss')}-${uuidv4().slice(0, 8)}`;

            let vnp_Params = {
                'vnp_Version': PaymentService.config.vnp_Version,
                'vnp_Command': PaymentService.config.vnp_Command,
                'vnp_TmnCode': PaymentService.config.vnp_TmnCode,
                'vnp_Locale': 'vn',
                'vnp_CurrCode': PaymentService.config.vnp_CurrCode,
                'vnp_TxnRef': vnpTxnRef,
                'vnp_OrderInfo': `Payment for order: ${orderId}`,
                'vnp_OrderType': 'other',
                'vnp_Amount': amount * 100,
                'vnp_ReturnUrl': PaymentService.config.vnp_ReturnUrl,
                'vnp_IpAddr': ipAddr,
                'vnp_CreateDate': createDate
            };


            vnp_Params = PaymentService.sortObject(vnp_Params);
            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", PaymentService.config.vnp_HashSecret);
            vnp_Params['vnp_SecureHash'] = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
            const paymentUrl = PaymentService.config.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
            await session.commitTransaction();

            return {
                paymentUrl,
                paymentId: payment[0]._id
            };
        } catch (error) {
            await session.abortTransaction();
            console.error('Payment creation error:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async vnpayReturn(vnpayResponse) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const secureHash = vnpayResponse['vnp_SecureHash'];
            const responseParams = { ...vnpayResponse };
            delete responseParams['vnp_SecureHash'];
            delete responseParams['vnp_SecureHashType'];

            const sortedParams = PaymentService.sortObject(responseParams);
            const signData = querystring.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac("sha512", PaymentService.config.vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            if (secureHash !== signed) {
                throw new BadRequestError('Invalid signature');
            }

            const txnRef = vnpayResponse['vnp_TxnRef'];
            const rspCode = vnpayResponse['vnp_ResponseCode'];
            const isSuccessful = rspCode === '00';

            const payment = await Payment.findOneAndUpdate(
                {
                    payment_transaction_id: txnRef,
                    payment_status: 'PENDING'
                },
                {
                    payment_status: isSuccessful ? 'COMPLETED' : 'FAILED',
                    payment_response: vnpayResponse,
                    payment_transaction_id: vnpayResponse['vnp_TransactionNo'],
                    payment_time: new Date()
                },
                {
                    new: true,
                    session
                }
            );

            if (!payment) {
                throw new NotFoundError('Payment not found or already processed');
            }

            await order.findOneAndUpdate(
                { _id: payment.payment_orderId },
                {
                    'order_payment.payment_status': isSuccessful ? 'COMPLETED' : 'FAILED',
                    'order_payment.payment_id': payment._id
                },
                { session }
            );

            if (isSuccessful) {
                await publishNotification({
                    type: 'payment.success',
                    data: {
                        orderId: payment.payment_orderId,
                        userId: payment.payment_userId,
                        amount: payment.payment_amount,
                        transactionId: payment.payment_transaction_id
                    }
                });
            }

            await session.commitTransaction();
            return {
                code: rspCode,
                message: isSuccessful ? 'Payment successful' : 'Payment failed',
                data: payment
            };

        } catch (error) {
            await session.abortTransaction();
            console.error('Payment return error:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static sortObject(obj) {
        return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
    }

    static async getPaymentById(paymentId) {
        try {
            const paymentData = await Payment.findOne({
                _id: convertToObjectIdMongoDb(paymentId)
            }).lean();

            if (!paymentData) {
                throw new NotFoundError('Payment not found');
            }

            return paymentData;
        } catch (error) {
            console.error('Get payment error:', error);
            throw error;
        }
    }

    static async getPaymentsByOrder(orderId) {
        try {
            const paymentData = await Payment.findOne({
                payment_orderId: convertToObjectIdMongoDb(orderId)
            }).lean();

            if (!paymentData) {
                throw new NotFoundError('Payment not found');
            }

            return paymentData;
        } catch (error) {
            console.error('Get payments by order error:', error);
            throw error;
        }
    }
}

module.exports = PaymentService;
