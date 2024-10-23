
'use strict'


const { model, Schema, Types } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { getNextSequence } = require('../utils/sequenceUtils');

const DOCUMENT_NAME = 'User'
const COLLECTION_NAME = 'Users'


const userSchema = new Schema({
    usr_id: {
        type: Number,
        required: true,
        unique: true
    },
    usr_slug: {   //là id ảo của user khi show ở social hoặc network
        type: String,
        unique: true,
        default: uuidv4(),
    },
    usr_name: {
        type: String,
        required: true,
    },
    usr_password: {
        type: String,
        required: true,
    },
    usr_salt: {
        type: String
    },
    usr_email: {
        type: String,
        required: true,
        unique: true,
    },
    usr_phone: {
        type: String,
        default: '',
    },
    usr_sex: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other',
    },
    usr_avatar: {
        type: String,
        default: '',
    },
    usr_date_of_birth: {
        type: Date,
    },
    usr_role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
        //default: null
    },
    usr_status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'inactive', 'active', 'banned']
    },
    usr_addresses: [{
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        isDefault: Boolean
    }],
    usr_wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    usr_cart: {
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    },
    usr_reset_password_token: String,
    usr_reset_password_expires: Date,
    usr_password_reset_count: {
        type: Number,
        default: 0
    },
    usr_last_password_reset_request: {
        type: Date
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


userSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.usr_id = await getNextSequence('usr_id');
    }
    next();
});

module.exports =
    model(DOCUMENT_NAME, userSchema);
