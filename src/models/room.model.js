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
    unreadCount: {
        user: { type: Number, default: 0 },
        shop: { type: Number, default: 0 }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: Schema.Types.ObjectId,
        refPath: 'deletedByType'
    },
    deletedByType: {
        type: String,
        enum: ['user', 'shop']
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

roomSchema.index({ user: 1, shop: 1 });
roomSchema.index({ lastUserActivity: 1 });
roomSchema.index({ lastShopActivity: 1 });
roomSchema.index({ isDeleted: 1 });


module.exports = model(DOCUMENT_NAME, roomSchema);
