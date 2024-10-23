'use strict'

const NotificationRabbit = require('../../services/notification.rabbit');
const { setupRabbitMQ, queues } = require('../rabbitmqConfig');


const notificationConsumer = async () => {
    try {
        const { channel } = await setupRabbitMQ();

        channel.consume(queues.notification, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log('Received notification.process message:', content);
                try {
                    await NotificationRabbit.processNotification(content);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing notification:', error);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

        console.log('Notification Consumer is running...');
    } catch (error) {
        console.error('Error in Notification Consumer:', error);
    }
};

module.exports = notificationConsumer;
