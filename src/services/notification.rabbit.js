
'use strict'

const SocketIOService = require('./socketio.service');
const { NOTI } = require('../models/notification.model');
const { User } = require('../models/user.model');
const { Shop } = require('../models/shop.model');
const EmailService = require('./email.service');
const { promisify } = require('util');
const { promisify } = require('util');
const { getRedis } = require('../dbs/init.redis');
const {
    instanceConnect: redisClient
} = getRedis();

class NotificationRabbit {
    static async processNotification(message) {
        const { type, data } = message;

        let notificationData = {};
        let recipientType = 'user';


        switch (type) {
            case 'order.created':
                notificationData = {
                    action: 'Đặt hàng thành công',
                    orderCode: data.order_trackingNumber,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    timestamp: new Date(),
                };
                recipientType = 'user';
                break;
            case 'order.cancelled':
                notificationData = {
                    action: 'Đã hủy đơn hàng',
                    orderCode: data.order_trackingNumber,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    timestamp: new Date(),
                };
                recipientType = 'user';
                break;
            case 'order.confirmed':
                notificationData = {
                    action: `Đơn hàng của người dùng ${data.userName} đã được xác nhận, sẽ tiến hành qua giai đoạn shipping.`,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    timestamp: new Date(),
                };
                recipientType = 'user';
                break;
            case 'shop.new_order':
                notificationData = {
                    action: `Có đơn hàng mới từ người dùng ${data.userName}`,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    products: data.products,
                    timestamp: new Date(),
                };
                recipientType = 'shop';
                break;
            case 'shop.order_cancelled':
                notificationData = {
                    action: `Đơn hàng đã bị hủy bởi người dùng ${data.userName}`,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    products: data.products,
                    timestamp: new Date(),
                };
                recipientType = 'shop';
                break;
            case 'shop.order_success':
                notificationData = {
                    action: `Đơn hàng đã được vận chuyển thành công cho người dùng ${data.userName}`,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    userId: data.userId,
                    timestamp: new Date(),
                };
                recipientType = 'shop';
                break;
            case 'shop.inventory_updated':
                notificationData = {
                    action: 'Đã cập nhật kho hàng',
                    products: data.products,
                    receivedId: data.receivedId,
                    senderId: data.senderId,
                    timestamp: new Date(),
                };
                recipientType = 'shop';
                break;

            default:
                console.warn(`Unknown notification type: ${type}`);
                return;
        }

        let senderModel = notificationData.senderId === null ? 'System' : (notificationData.recipientType === 'shop' ? 'User' : 'Shop');
        let receivedModel = notificationData.recipientType === 'shop' ? 'Shop' : 'User'
        let options = notificationData.products ? notificationData.products : ''

        const notification = await createNotiSocket({
            type,
            senderId: notificationData.senderId,
            senderModel: senderModel,
            receivedId: notificationData.receivedId,
            receivedModel: receivedModel,
            content: notificationData.action,
            options: {
                options
            }
        });


        const isOnline = await SocketIOService.sendNotification(notificationData.receivedId, recipientType, notification);

        if (!isOnline) {
            notification.isRead = false;
            await notification.save();
        }

    } catch(error) {
        console.error('Error:', error);
        throw error;
    }

    static async handleDLQMessage(content) {
        try {
            EmailService.sendEmailDQLNoti(content)
        } catch (error) {
            console.error('Error in handleDLQMessage:', error);
            throw error;
        }
    }
}

module.exports = NotificationRabbit;
