'use strict'

const { setupRabbitMQ, queues } = require('../rabbitmqConfig');
const {updateInventory} = require('../../models/repositories/inventory.repo')

const inventoryConsumer = async () => {
    try {
        const { channel } = await setupRabbitMQ();

        channel.consume(queues.inventory, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log('Received inventory.process message:', content);
                try {
                    await updateInventory(content);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing inventory:', error);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

        console.log('Inventory Consumer is running...');
    } catch (error) {
        console.error('Error in Inventory Consumer:', error);
    }
};

module.exports = inventoryConsumer;
