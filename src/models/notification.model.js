'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Notification'
const COLLECTION_NAME = 'Notifications'

const notificationSchema = new Schema({
    noti_type: {
        type: String,
        required: true
    },
    noti_senderId: {
        type: Schema.Types.ObjectId,
        required: false,
        refPath: 'noti_senderModel'
    },
    noti_senderModel: {
        type: String,
        enum: ['User', 'Shop', 'System'],
        required: false
    },
    noti_receivedId: {
        type: Schema.Types.ObjectId,
        required: false,
        refPath: 'noti_receivedModel'
    },
    noti_receivedModel: {
        type: String,
        enum: ['User', 'Shop'],
        required: false
    },
    noti_content: {
        type: String,
        required: true,
    },
    noti_options: {
        type: Object,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


module.exports =
{
    NOTI: model(DOCUMENT_NAME, notificationSchema)
}