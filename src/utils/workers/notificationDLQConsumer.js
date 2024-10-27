'use strict';

const NotificationRabbit = require('../../services/notification.rabbit');
const { setupRabbitMQ, queues, deadLetterExchanges } = require('../rabbitmqConfig');


const notificationDLQConsumer = async () => {
    try {
        const { channel } = await setupRabbitMQ();

        const dlxExchange = deadLetterExchanges.notificationDLX;
        const dlqQueue = queues.notificationDLQ;

        await channel.assertExchange(dlxExchange, 'fanout', { durable: true });
        await channel.assertQueue(dlqQueue, { durable: true });
        await channel.bindQueue(dlqQueue, dlxExchange, '');
        await channel.prefetch(1);
        channel.consume(dlqQueue, async (msg) => {
            if (msg !== null) {
                const content = msg.content.toString();
                console.log('Received message in DLQ:', content);
                try {
                    await NotificationRabbit.handleDLQMessage(content);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing DLQ message:', error);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

        console.log('Notification DLQ Consumer is running...');
    } catch (error) {
        console.error('Error in Notification DLQ Consumer:', error);
    }
};

module.exports = notificationDLQConsumer;