'use strict'

const socketIo = require('socket.io');
const { promisify } = require('util');
const { getIORedis } = require('../dbs/init.ioredis');
const userModel = require('../models/user.model');
const { convertToObjectIdMongoDb } = require('../utils');
const shopModel = require('../models/shop.model');
const NotificationRabbit = require('./notification.rabbit');
const MessageService = require('./message.service');
const { AuthFailureError } = require('../core/error.response');
const PresenceService = require('./presence.service');

const redisClient = getIORedis().instanceConnect;

class SocketIOService {
    static io;
    static heartbeatInterval = 25000;


    static async #getUserInfo(userId) {
        const userAccount = await userModel.findById(convertToObjectIdMongoDb(userId)).lean();
        if (!userAccount) {
            const shopAccount = await shopModel.findById(convertToObjectIdMongoDb(userId)).lean();
            return {
                userId: shopAccount._id,
                userType: 'shop'
            };
        }
        return {
            userId: userAccount._id,
            userType: 'user'
        };
    }

    static init(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.use(async (socket, next) => {
            try {
                const req = socket.request;
                if (!req.user) {
                    throw new AuthFailureError('Authentication required');
                }
                socket.user = req.user;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', socket => this.handleConnection(socket));

        console.log('Socket.io is initialized.');
    }

    static async #validateRoomAccess(roomId, userId, userType) {
        const room = await RoomService.getRoomById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const hasAccess = userType === 'user'
            ? room.user.toString() === userId.toString()
            : room.shop.toString() === userId.toString();

        if (!hasAccess) {
            throw new Error('Access denied to this room');
        }

        return room;
    }



    static async handleConnection(socket) {
        const { user } = socket;
        const { userId, userType } = await this.#getUserInfo(user.userId);

        const key = `noti-${userType}:${userId}:sockets`;
        await redisClient.sadd(key, socket.id);


        await PresenceService.updatePresence(userId, userType, 'online')

        socket.on('joinRoom', async (roomId) => {
            const room = await this.#validateRoomAccess(roomId, userId, userType);
            socket.join(roomId);

            if (userType === 'shop' && !room.lastShopActivity) {
                await RoomService.initializeShopActivity(roomId);
            }

            await MessageService.markMessagesAsRead(roomId, userI, userType);
            socket.emit('roomJoined', { roomId });
        });

        socket.on('typing', async (roomId) => {
            const room = await this.#validateRoomAccess(roomId, userId, userType);
            socket.to(roomId).emit('userTyping', { userId, userType });
        });

        socket.on('stopTyping', async (roomId) => {
            const room = await this.#validateRoomAccess(roomId, userId, userType);
            socket.to(roomId).emit('userStopTyping', { userId, userType });
        });

        socket.on('sendMessage', async (data) => {
            try {
                const { roomId, content, attachments } = data;

                await this.#validateRoomAccess(roomId, userId, userType);

                socket.to(roomId).emit('userStopTyping', { userId, userType });

                const message = await MessageService.sendMessage(roomId, userId, userType, {
                    content,
                    attachments
                });

                this.io.to(roomId).emit('newMessage', message);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('messageError', {
                    error: error.message,
                    timestamp: new Date()
                });
            }
        });

        const heartbeat = setInterval(async () => {
            await PresenceService.updatePresence(userId, userType, 'online');
        }, this.heartbeatInterval);

        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            socket.emit('roomLeft', { roomId });
        });


        socket.on('disconnect', async () => {
            clearInterval(heartbeat);
            await this.handleDisconnect(socket);
            await PresenceService.updatePresence(userId, userType, 'offline');

        });
    }

    static async handleDisconnect(socket) {
        const { user } = socket;
        const { userId, userType } = await this.#getUserInfo(user.userId);

        if (userId) {
            const key = `noti-${userType}:${userId}:sockets`;
            await redisClient.srem(key, socket.id);
        }
    }

    static async sendNotification(recipientId, recipientType, data) {
        const key = `noti-${recipientType}:${recipientId}:sockets`;
        const socketIds = await redisClient.smembers(key);

        if (socketIds.length > 0) {
            const dataArray = Array.isArray(data) ? data : [data];
            socketIds.forEach(socketId => {
                dataArray.forEach(notification => {
                    this.io.to(socketId).emit('notification', notification);
                });
            });
            console.log(`Notification sent to ${recipientType} ID: ${recipientId}`);
            return true;
        } else {
            console.log(`No active sockets for ${recipientType} ID: ${recipientId}`);
            return false;
        }
    }

    static getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }
}

module.exports = SocketIOService;
