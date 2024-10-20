'use strict'

const amqp = require('amqplib');

const amqp_url_docker = 'amqp://guest:12345@rabbitmq';

const exchanges = {
    order: 'orderExchange',
    inventory: 'inventoryExchange',
    email: 'emailExchange',
    notification: 'notificationExchange'
};

const queues = {
    order: 'orderQueue',
    inventory: 'inventoryQueue',
    email: 'emailQueue',
    notification: 'notificationQueue',
    notificationDLQ: 'notificationDLQ' 
};

const routingKeys = {
    orderCreate: 'order.create',
    inventoryUpdate: 'inventory.update',
    emailSend: 'email.send',
    notificationProcess: 'notification.process'
};

const deadLetterExchanges = {
    notificationDLX: 'notificationDLX',
};

const setupRabbitMQ = async () => {
    try {

        const connection = await amqp.connect(amqp_url_docker);
        const channel = await connection.createChannel();
        
        await Promise.all(Object.values(exchanges).map(exchange =>
            channel.assertExchange(exchange, 'direct', { durable: true })
        ));

        await channel.assertExchange(deadLetterExchanges.notificationDLX, 'fanout', { durable: true });

        await Promise.all([
            channel.assertQueue(queues.order, { durable: true }),
            channel.assertQueue(queues.inventory, { durable: true }),
            channel.assertQueue(queues.email, { durable: true }),
            channel.assertQueue(queues.notification, { 
                durable: true,
                deadLetterExchange: deadLetterExchanges.notificationDLX 
            }),
            channel.assertQueue(queues.notificationDLQ, { durable: true }) 
        ]);

        await Promise.all([
            channel.bindQueue(queues.order, exchanges.order, routingKeys.orderCreate),
            channel.bindQueue(queues.inventory, exchanges.inventory, routingKeys.inventoryUpdate),
            channel.bindQueue(queues.email, exchanges.email, routingKeys.emailSend),
            channel.bindQueue(queues.notification, exchanges.notification, routingKeys.notificationProcess),
            channel.bindQueue(queues.notificationDLQ, deadLetterExchanges.notificationDLX, '')
        ]);

        console.log('RabbitMQ setup completed.');
        return { connection, channel };
    } catch (error) {
        console.error('Error setting up RabbitMQ:', error);
        throw error;
    }
};

module.exports = {
    exchanges,
    queues,
    routingKeys,
    deadLetterExchanges,
    setupRabbitMQ
};