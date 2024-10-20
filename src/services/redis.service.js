

// khóa bi quan
'use strict'

const { promisify } = require('util');
const { reservationInventory } = require('../models/repositories/inventory.repo');

const { getRedis } = require('../dbs/init.redis')
const {
    instanceConnect: redisClient
} = getRedis()

const pexpire = promisify(redisClient.pexpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setnx).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);

const generateUniqueValue = () => `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

const acquireLock = async (productId, quantity, cartId, shopId) => {
    const key = `lock_v2024_${productId}`;
    const uniqueValue = generateUniqueValue();
    const retrytimes = 10;
    const expireTime = 3000 

    for (let i = 0; i < retrytimes; i++) {
        const result = await setnxAsync(key, uniqueValue)
        if (result === 1) {
            const isReservation = await reservationInventory({
                productId, quantity, cartId, shopId
            })
            if (isReservation.modifiedCount) {
                await pexpire(key, expireTime)
                return { key, uniqueValue };
            }
            await delAsync(key);
            return null;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }
}


const releaseLock = async (key, uniqueValue) => {
    const currentValue = await getAsync(key);
    if (currentValue === uniqueValue) {
        await delAsync(key);
        console.log(`Khóa ${key} đã được giải phóng.`);
    } else {
        console.log(`Khóa ${key} đã được đổi bởi một yêu cầu khác.`);
    }
}

module.exports = {
    acquireLock,
    releaseLock
}

