'use strict'
const { SuccessResponse } = require('../core/success.response');
const MessageService = require('../services/message.service');

class MessageController {
    sendMessage = async (req, res, next) => {
        const { roomId, content, attachments } = req.body;
        const { userId, userType } = req.user;

        new SuccessResponse({
            message: 'Send message success',
            metadata: await MessageService.sendMessage(roomId, userId, userType, {
                content,
                attachments
            })
        }).send(res);
    }

    getMessagesByRoom = async (req, res, next) => {
        const { roomId } = req.params;
        const { limit = 50, page = 1 } = req.query;

        new SuccessResponse({
            message: 'Get messages success',
            metadata: await MessageService.getMessagesByRoom(roomId, parseInt(limit), parseInt(page))
        }).send(res);
    }

    markMessagesAsRead = async (req, res, next) => {
        const { roomId } = req.params;
        const { userId, userType } = req.user;

        new SuccessResponse({
            message: 'Mark messages as read success',
            metadata: await MessageService.markMessagesAsRead(roomId, userId, userType)
        }).send(res);
    }

    getUnreadCount = async (req, res, next) => {
        const { roomId } = req.params;
        const { userId } = req.user;

        new SuccessResponse({
            message: 'Get unread count success',
            metadata: await MessageService.getUnreadMessageCount(roomId, userId)
        }).send(res);
    }
}
module.exports = new MessageController()
