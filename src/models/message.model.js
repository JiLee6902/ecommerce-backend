'use strict';

const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Message';
const COLLECTION_NAME = 'Messages';

const messageSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        required: true
    },
    senderType: {
        type: String,
        enum: ['user', 'shop'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, messageSchema);
