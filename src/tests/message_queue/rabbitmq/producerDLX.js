
const amqp = require('amqplib');
const amqp_url_docker = 'amqp://guest:12345@localhost'

const runProducer = async () => {
    try {
        const connection = await amqp.connect(amqp_url_docker)
        const channel = await connection.createChannel()

        const notificationExchange = 'notificationEx'
        const notiQueue = 'notificationQueueProcess'

        const notificationExchangeDLX = 'notificationExDLX'
        const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX'

       await channel.assertExchange(notificationExchange, 'direct', {
           durable: true
       })

        const queueResult = await channel.assertQueue(notiQueue, {
            exclusive: false,
            deadLetterExchange: notificationExchangeDLX,
            deadLetterRoutingKey: notificationRoutingKeyDLX,
        })

        await channel.bindQueue(queueResult.queue, notificationExchange)

        const msg = 'a new product'
        const sent = await channel.sendToQueue(queueResult.queue, Buffer.from(msg), {
            expiration: '10000'
        })

        if (sent) {
            console.log(`Message sent to queue ${notiQueue}: ${msg}`);
        } else {
            console.error('Failed to send message');
        }

    } catch (err) {
        console.log('Error::', err)
    }  finally {
        if (connection) {
            await connection.close();
        }
        process.exit(0);
    }
}

runProducer().then(rs => console.log(rs)).catch(console.error)



