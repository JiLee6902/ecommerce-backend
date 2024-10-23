'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Shop'
const COLLECTION_NAME = 'Shops'



const shopSchema = new Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 150
    },
    email: {
        type: String,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,

    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive','banned'],
        default: 'active',
    },
    verify: {
        type: Schema.Types.Boolean,
        default: false,
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    total_sales: {
        type: Number,
        default: 0
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});
shopSchema.index({ name: 1 });


module.exports = model(DOCUMENT_NAME, shopSchema);