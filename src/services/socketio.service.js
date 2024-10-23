'use strict'

const socketIo = require('socket.io');
const { promisify } = require('util');
const { getIORedis } = require('../dbs/init.ioredis');
const userModel = require('../models/user.model');
const { convertToObjectIdMongoDb } = require('../utils');
const shopModel = require('../models/shop.model');
const NotificationRabbit = require('./notification.rabbit');
const MessageService = require('./message.service');

const redisClient = getIORedis().instanceConnect;

class SocketIOService {
    static io;

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
            const req = socket.request;
            try {
                if (req.user) {
                    socket.user = req.user;
                    next();
                }
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', socket => this.handleConnection(socket));

        console.log('Socket.io is initialized.');
    }

    static async handleConnection(socket) {
        const { user } = socket;
        const { userId, userType } = await this.#getUserInfo(user.userId);

        const key = `noti-${userType}:${userId}:sockets`;
        await redisClient.sadd(key, socket.id); 

        socket.on('joinRoom', async (roomId) => {
            socket.join(roomId);
            await MessageService.markMessagesAsRead(roomId, userId);
        });

        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
        });

        socket.on('sendMessage', async (data) => {
            const { roomId, content } = data;
            const message = await MessageService.sendMessage(roomId, userId, userType, content);
            this.io.to(roomId).emit('newMessage', message);
        });

        socket.on('disconnect', () => this.handleDisconnect(socket));
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
