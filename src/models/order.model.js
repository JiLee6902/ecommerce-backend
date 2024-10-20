'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Order'
const COLLECTION_NAME = 'Orders'


const orderSchema = new Schema({
    order_userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_checkout: {
        type: Object,
        default: {}
        /*
        order_checkout = {
            totalPrice, 
            totalApplyDiscount
            totalFreeship,
            totalCheckout
        }
        */
    },
    order_shipping: {
        type: Object,
        default: {}
    },
    order_payment: {
        type: Object,
        default: {},
        /*
        order_payment = {
            method: String, // 'credit_card', 'paypal', 'vnpay', etc.
            status: String, // 'paid', 'pending', 'failed'
            transactionId: String, // Mã giao dịch từ cổng thanh toán
            amount: Number, // Số tiền thanh toán
            currency: String, //  'USD', 'VND'
        }
        */
    },
    order_products: {
        type: Array,
        require: true,
    },
    order_trackingNumber: {
        type: String,
        unique: true,
        default: '#0000820062024',
    },
    order_status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'cancelled', 'success'],
        default: 'pending'
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

skuSchema.index({ order_trackingNumber: 1 });



module.exports = {
    order: model(DOCUMENT_NAME, orderSchema)
}