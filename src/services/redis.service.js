'use strict';
const { getIORedis } = require('../dbs/init.ioredis');
const redisClient = getIORedis().instanceConnect;

const { reservationInventory } = require('../models/repositories/inventory.repo');

const generateUniqueValue = () => `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

const acquireLock = async (productId, quantity, cartId, shopId) => {
    const key = `lock_v2024_${productId}`;
    const uniqueValue = generateUniqueValue();
    const retryTimes = 10;
    const expireTime = 3000; // Thời gian hết hạn khóa

    for (let i = 0; i < retryTimes; i++) {
        const result = await redisClient.set(key, uniqueValue, 'NX', 'PX', expireTime);
        if (result === 'OK') {
            const isReservation = await reservationInventory({
                productId, quantity, cartId, shopId
            });
            if (isReservation.modifiedCount) {
                return { key, uniqueValue }; t
            }
            await redisClient.del(key);
            return null;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 50)); 
        }
    }
}

const releaseLock = async (key, uniqueValue) => {
    const currentValue = await redisClient.get(key);
    if (currentValue === uniqueValue) {
        await redisClient.del(key);
        console.log(`Khóa ${key} đã được giải phóng.`);
    } else {
        console.log(`Khóa ${key} đã được đổi bởi một yêu cầu khác.`);
    }
}

module.exports = {
    acquireLock,
    releaseLock
}
