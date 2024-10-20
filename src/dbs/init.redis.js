

'use strict'

const redis = require('redis')
const { RedisErrorReponse } = require('../core/error.response')

let client = {}, statusConnectRedis = {
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
        console.log(`connectionRedis - Connection status: connected`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log(`connectionRedis - Connection status: disconnected`)
        handleTimeoutError()
    })

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log(`connectionRedis - Connection status: reconnecting`)
        clearTimeout(connectionTimeout)
    })

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.log(`connectionRedis - Connection status: error ${err}`)
        handleTimeoutError()

    })
}

const initRedis = (options = {}) => {
    const defaultOptions = {
        url: 'redis://redis:6379',
        retry_strategy: (options) => { 
            if (options.attempt > 10) {
                return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
        }
    };

    const instanceRedis = redis.createClient({ ...defaultOptions, ...options });

    client.instanceConnect = instanceRedis;
    handleEventConnection({
        connectionRedis: instanceRedis
    });
}

const getRedis = () => client

const closeRedis = () => {
    if (client.instanceConnect) {
        client.instanceConnect.quit((err, res) => {
            if (err) {
                console.error('Error closing Redis connection:', err)
            } else {
                handleEventConnection(client.instanceConnect)
                console.log('Redis connection closed:', res)
            }
        })
    } else {
        console.warn('Redis client is not initialized.')
    }
}


module.exports = {
    initRedis,
    getRedis,
    closeRedis
}