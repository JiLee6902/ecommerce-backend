'use strict'

const Message = require('../models/message.model');
const Room = require('../models/room.model');

class MessageService {
    static async sendMessage(roomId, senderId, senderType, content) {
        const message = new Message({
            room: roomId,
            sender: senderId,
            senderType,
            content
        });
        const savedMessage = await message.save();

        await Room.findByIdAndUpdate(roomId, { lastMessage: savedMessage._id });

        return savedMessage;
    }

    static async getMessagesByRoom(roomId, limit = 50, page = 1) {
        const skip = (page - 1) * limit;
        return await Message.find({ room: roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name');
    }

    static async markMessagesAsRead(roomId, userId) {
        await Message.updateMany(
            { room: roomId, sender: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );
    }
}

module.exports = MessageService;