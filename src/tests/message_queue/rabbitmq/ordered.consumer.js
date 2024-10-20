'use strict'

const amqp = require('amqplib');
const amqp_url_docker = 'amqp://guest:12345@localhost'

async function consumerOrderedMessage() {

    const connection = await amqp.connect(amqp_url_docker)
    const channel = await connection.createChannel()

    const queueName = 'ordered-queued-message'
    await channel.assertQueue(queueName, {
        durable: true
    })

    await channel.prefetch(1);
    channel.consume(queueName, msg => {
        const message = msg.content.toString()
        setTimeout(() => {
            console.log('processed: ', message)
            channel.ack(msg)
        }, Math.random() * 1000)
    }, {
        noAck: false
    })
}

consumerOrderedMessage().catch(err => console.error(err))

