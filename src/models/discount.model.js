'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Discount'
const COLLECTION_NAME = 'Discounts'

const DELETED_DOCUMENT_NAME = 'DeletedDiscount';
const DELETED_COLLECTION_NAME = 'DeletedDiscounts';


const discountSchema = new Schema({
    discount_name: {
        type: String,
        required: true,
    },
    discount_description: {
        type: String,
        required: true,
    },
    discount_type: {
        type: String,
        default: 'fixed_amount', //percentage
    },
    discount_value: {
        type: String,
        required: true,
    },
    discount_code: {
        type: String,
        required: true
    },
    discount_start_date: {
        type: Date,
        required: true
    },
    discount_end_date: {
        type: Date,
        required: true
    },
    discount_max_uses: { //so luong discount duoc ap lung
        type: Number,
        required: true
    },
    discount_uses_count: { // so discount da su dung
        type: Number,
        required: true
    },
    discount_users_used: { // ai su dung
        type: Array,
        default: []
    },
    discount_max_uses_per_user: { // cho phep sd toi da cho moi user
        type: Number,
        required: true
    },
    discount_min_order_value: { //gia trị đơn hàng tối thiểu để được apply discount
        type: Number,
        required: true
    },
    discount_shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    },
    discount_is_active: {
        type: Boolean,
        default: true
    },
    discount_applies_to: {
        type: String,
        required: true,
        enum: ['all', 'specific']
    },
    discount_product_ids: {
        type: Array,
        default: []
    }

}, {
    timestamps: true,
    collection: COLLECTION_NAME
});




module.exports = {
    discount: model(DOCUMENT_NAME, discountSchema),
}

