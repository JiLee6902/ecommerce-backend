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

    for (let i = 0; i < 10; i++) {
        const message = `ordered-queue-messgae:: ${i}`
        console.log('Message::', message)
        channel.sendToQueue(queueName, Buffer.from(message), {
            persistent: true
        })

    }

    setTimeout(() => {
        connection.close()
    }, 1000)
}

consumerOrderedMessage().catch(err => console.error(err))


