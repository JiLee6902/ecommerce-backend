'use strict';

const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Room';
const COLLECTION_NAME = 'Rooms';

const roomSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, roomSchema);
