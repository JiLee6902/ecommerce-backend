'use strict'

const { BadRequestError } = require('../core/error.response');
const Message = require('../models/message.model');
const Room = require('../models/room.model');
const { uploadImageFromLocalS3 } = require('../services/upload.service')
class MessageService {
    static async sendMessage(roomId, senderId, senderType, data) {
        try {
            if (!data.content && !data.attachments?.length) {
                throw new Error('Message content or attachments required');
            }

            const messageData = {
                room: roomId,
                sender: senderId,
                senderType,
                content: data.content || '',
                type: data.attachments?.length ? 'image' : 'text',
                isRead: false,
                status: 'sent',
                attachments: [],
            };

            if (data.attachments?.length) {
                messageData.attachments = await Promise.all(data.attachments.map(async file => {
                    const uploadResult = await uploadImageFromLocalS3({
                        file,
                        folderName: `room/${roomId}`
                    });

                    return {
                        url: uploadResult.url,
                        fileType: file.mimetype,
                        fileName: file.originalname,
                        fileSize: file.size
                    };
                }));
            }

            await Message.create(messageData);
            await Room.findByIdAndUpdate(roomId, {
                lastMessage: savedMessage._id,
                [`unreadCount.${senderType === 'user' ? 'shop' : 'user'}`]: { $inc: 1 }
            });


            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('sender', senderType === 'user' ? 'usr_name usr_avatar' : 'name avatar')
                .lean();

            return populatedMessage;
        }
        catch (error) {
            throw new BadRequestError("Error")
        }
    }



    static async getMessagesByRoom(roomId, limit = 50, page = 1) {
        const skip = (page - 1) * limit;
        return await Message.find({ room: roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'sender',
                select: function () {
                    return this.senderType === 'shop' ? 'name avatar' : 'usr_name usr_avatar';
                },
                transform: function (doc) {
                    if (!doc) return null;
                    return {
                        name: doc.name || doc.usr_name,
                        avatar: doc.avatar || doc.usr_avatar,
                        senderType: this.senderType
                    };
                }
            })
            .lean();
    }

    static async markMessagesAsRead(roomId, userId, userType) {
        const updateResult = await Message.updateMany(
            {
                room: roomId,
                sender: { $ne: userId },
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                    status: 'read'
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            await Room.findByIdAndUpdate(roomId, {
                [`unreadCount.${userType}`]: 0
            });
        }

        return updateResult.modifiedCount;
    }

    static async getUnreadMessageCount(roomId, userId) {
        return await Message.countDocuments({
            room: roomId,
            sender: { $ne: userId },
            isRead: false
        });
    }
}

module.exports = MessageService;