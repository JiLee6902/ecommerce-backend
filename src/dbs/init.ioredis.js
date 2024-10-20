
'use strict'

const Redis = require('ioredis')
const { RedisErrorReponse } = require('../core/error.response')

let clients = {}, statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error'
}, connectionTimeout

const REDIS_CONNECT_TIMEOUT = 10000, REDIS_CONNECT_MESSAGE = {
    code: -500,
    message: {
        vn: 'Redis xảy ra lỗi!',
        en: 'Service connection error!'
    }
}

const handleTimeoutError = () => {
    connectionTimeout = setTimeout(() => {
        throw new RedisErrorReponse({
            message: REDIS_CONNECT_MESSAGE.message.vn,
            statusCode: REDIS_CONNECT_MESSAGE.code
        })
    }, REDIS_CONNECT_TIMEOUT)
}

const handleEventConnection = ({
    connectionRedis
}) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log(`connectionIORedis - Connection status: connected`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log(`connectionIORedis - Connection status: disconnected`)
        handleTimeoutError()
    })

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log(`connectionIORedis - Connection status: reconnecting`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.log(`connectionIORedis - Connection status: error ${err}`)
        handleTimeoutError()

    })
}

const initIORedis = ({
    IOREDIS_IS_ENABLED,
    IOREDIS_HOST = 'redis',
    IOREDIS_PORT = 6379
}) => {
    if (IOREDIS_IS_ENABLED) {
        const instanceRedis = new Redis({
            host: IOREDIS_HOST,
            port: IOREDIS_PORT
        })

        clients.instanceConnect = instanceRedis;
        handleEventConnection({
            connectionRedis: instanceRedis
        });
    }

}

const getIORedis = () => clients

const closeIORedis = () => {
    if (clients.instanceConnect) {
        clients.instanceConnect.quit((err, res) => {
            if (err) {
                console.error('Error closing Redis connection:', err)
            } else {
                handleEventConnection(clients.instanceConnect)
                console.log('Redis connection closed:', res)
            }
        })
    } else {
        console.warn('Redis client is not initialized.')
    }
}


module.exports = {
    initIORedis,
    getIORedis,
    closeIORedis
}