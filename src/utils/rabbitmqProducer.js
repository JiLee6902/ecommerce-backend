
'use strict'

const { setupRabbitMQ, queues, deadLetterExchanges } = require('./rabbitmqConfig');

class RabbitMQProducer {
    static async publishToQueue(queueName, message) {
        const { channel } = await setupRabbitMQ();


        const queueOptions = queueName === queues.notification 
            ? {
                durable: true,
                deadLetterExchange: deadLetterExchanges.notificationDLX
            }
            : { durable: true };

        await channel.assertQueue(queueName, queueOptions);

        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });

        console.log(`Message sent to ${queueName}:`, message);
    }
}

const publishOrderCreated = (message) => RabbitMQProducer.publishToQueue(queues.order, { type: 'order.created', ...message });
const publishInventoryUpdate = (message) => RabbitMQProducer.publishToQueue(queues.inventory, { type: 'inventory.update', ...message });
const publishEmailSend = (message) => RabbitMQProducer.publishToQueue(queues.email, { type: 'email.send', ...message });
const publishNotification = (message) => RabbitMQProducer.publishToQueue(queues.notification, { ...message });
const publishOrderCancelled = (message) => RabbitMQProducer.publishToQueue(queues.order, { type: 'order.cancelled', ...message });
const publishOrderSuccessed = (message) => RabbitMQProducer.publishToQueue(queues.order, { type: 'order.successed', ...message });
const publishOrderConfirmed = (message) => RabbitMQProducer.publishToQueue(queues.order, { type: 'order.confirmed', ...message });




module.exports = {
    publishOrderCreated,
    publishInventoryUpdate,
    publishEmailSend,
    publishNotification,   
    publishOrderCancelled ,
    publishOrderSuccessed,
    publishOrderConfirmed
};
