'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Cart'
const COLLECTION_NAME = 'Carts'

const cartSchema = new Schema({
    cart_state: {
        type: String,
        enum: ['active', 'completed', 'failed', 'pending'],
        default: 'active'
    },
    cart_products: {
        type: Array,
        required: true,
        default: []
    },
    cart_count_product: {
        type: Number,
        default: 0,
    },
    cart_userId: {
        type: Number,
        required: true,
        unique: true,
    }
}, {
    timestamps: {
        createdAt: 'createdOn',
        updatedAt: 'modifyOn',

    },
    collection: COLLECTION_NAME
});

cartSchema.index({ cart_userId: 1 });


module.exports = {
    cart: model(DOCUMENT_NAME, cartSchema)
}