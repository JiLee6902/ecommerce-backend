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
        payment_method: {
            type: String,
            enum: ['VNPAY'],
            required: true
        },
        payment_status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        },
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Payment'
        }
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
        enum: ['pending', 'confirmed', 'shipping', 'cancelled', 'success'],
        default: 'pending'
    },
    order_shop_confirms: [{
        shopId: {
            type: Schema.Types.ObjectId,
            ref: 'Shop'
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending'
        }
    }],
    auto_confirm_deadline: {
        type: Date,
        default: function () {
            return new Date(Date.now() + 5 * 60000);
        }
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

orderSchema.index({ order_trackingNumber: 1 });



module.exports = {
    order: model(DOCUMENT_NAME, orderSchema)
}