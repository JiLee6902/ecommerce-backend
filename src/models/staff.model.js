'use strict'

const { model, Schema, Types } = require('mongoose');
const { getNextSequence } = require('../utils/sequenceUtils');

const DOCUMENT_NAME = 'Staff';
const COLLECTION_NAME = 'Staffs';

const staffSchema = new Schema({
    staff_id: {
        type: Number,
        required: true,
        unique: true
    },
    staff_name: {
        type: String,
        required: true,
    },
    staff_password: {
        type: String,
        required: true,
    },
    staff_email: {
        type: String,
        required: true,
        unique: true,
    },
    staff_phone: {
        type: String,
        default: '',
    },
    staff_sex: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other',
    },
    staff_date_of_birth: {
        type: Date,
    },
    staff_role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    staff_status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'inactive', 'active', 'terminated']
    },
    staff_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    staff_reset_password_token: String,
    staff_reset_password_expires: Date,
    staff_password_reset_count: {
        type: Number,
        default: 0
    },
    staff_last_password_reset_request: {
        type: Date
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

staffSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.staff_id = await getNextSequence('staff_id');
    }
    next();
});

module.exports = model(DOCUMENT_NAME, staffSchema);
