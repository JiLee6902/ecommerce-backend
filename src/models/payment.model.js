'use strict'

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Payment'
const COLLECTION_NAME = 'Payments'

const paymentSchema = new Schema({
    payment_userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment_orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    payment_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['VNPAY'],
        default: 'VNPAY'
    },
    payment_status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    payment_transaction_id: String,
    payment_response: Schema.Types.Mixed,
    payment_time: Date
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, paymentSchema);