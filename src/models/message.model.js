const { model, Schema } = require('mongoose');

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
        required: true,
        refPath: 'senderType' 
    },
    senderType: {
        type: String,
        enum: ['user', 'shop'],
        required: true
    },
    content: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
    },
    attachments: [{
        url: String,
        fileType: String,
        fileName: String,
        fileSize: Number
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['sent', 'read'], 
        default: 'sent'
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, senderType: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ room: 1, sender: 1, isRead: 1 });

module.exports = model(DOCUMENT_NAME, messageSchema);