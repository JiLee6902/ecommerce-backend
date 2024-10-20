'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Key'
const COLLECTION_NAME = 'Keys'


const keyTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['Shop', 'User']
    },
    privateKey: {
        type: String,
        trim: true,
        required: true,
    },
    publicKey: {
        type: String,
        trim: true,
        required: true,
    },

    refreshTokensUsed: {
        type: Array,
        default: []
    },
    refreshToken: {
        type: String,
        trim: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


module.exports = model(DOCUMENT_NAME, keyTokenSchema);