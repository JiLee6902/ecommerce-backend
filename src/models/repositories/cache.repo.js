
'use strict'

const { getIORedis } = require('../../dbs/init.ioredis');
const redisCache = getIORedis().instanceConnect

const setCacheIO = async ({
    key, value
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.set(key, value)
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const setCacheIOExpiration = async ({
    key, value, expirationInSeconds = 3600
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.set(key, value, 'EX', expirationInSeconds)
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const getCacheIO = async ({
    key
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.get(key)
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const delCacheIO = async ({
    key
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.del(key)
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const hgetCacheIO = async ({
    hash, field
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.hget(hash, field);
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const hsetCacheIO = async ({
    hash, field, value
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.hset(hash, field, value);
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

const hdelCacheIO = async ({
    hash, field
}) => {
    if (!redisCache) {
        throw new Error("Redis client not initialized!")
    }
    try {
        return await redisCache.hdel(hash, field);
    } catch (error) {
        throw new Error(`${error.message}`)
    }
}

module.exports = {
    setCacheIO,
    setCacheIOExpiration,
    getCacheIO,
    delCacheIO,
    hgetCacheIO, 
    hsetCacheIO, 
    hdelCacheIO
}