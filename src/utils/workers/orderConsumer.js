const { setupRabbitMQ, exchanges, queues, routingKeys } = require('../rabbitmqConfig');
const CheckoutService  = require('../../services/checkout.service');


const orderConsumer = async () => {
    try {
        const { channel } = await setupRabbitMQ();
        await channel.prefetch(1);
        channel.consume(queues.order, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log('Received order message:', content);

                try {
                    const { type, ...payload } = content;

                    switch (type) {
                        case 'order.created':
                            await CheckoutService.processOrder(payload);
                            break;
                        case 'order.cancelled':
                            await CheckoutService.processOrderCancelled(payload);
                            break;
                        case 'order.confirmed':
                            await CheckoutService.processOrderConfirmed(payload);
                            break;
                        case 'order.successed':
                            await CheckoutService.processOrderStatusUpdated(payload);
                            break;
                        default:
                            console.warn(`Unknown order message type: ${type}`);
                    }

                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing order message:', error);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

        console.log('Order Consumer is running...');
    } catch (error) {
        console.error('Error in Order Consumer:', error);
    }
};

module.exports = orderConsumer;