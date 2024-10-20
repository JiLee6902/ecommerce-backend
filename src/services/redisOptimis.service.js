const { inventory } = require('../models/inventory.model');
const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient();

redisClient.on('error', err => {
    console.error('Lỗi kết nối Redis:', err);
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const incrByAsync = promisify(redisClient.incrby).bind(redisClient);
const watchAsync = promisify(redisClient.watch).bind(redisClient);
const unwatchAsync = promisify(redisClient.unwatch).bind(redisClient);
const execMultiAsync = promisify(redisClient.multi().exec).bind(redisClient.multi());

const reservationInventoryV2 = async ({ productId, quantity, cartId }) => {
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const inventoryItem = await inventory.findOne({
                inven_productId: mongoose.Types.ObjectId(productId)
            }).session(session);

            if (!inventoryItem) {
                throw new Error('Không tìm thấy sản phẩm trong kho');
            }

            const redisKey = `inventory:${inventoryItem._id}`;

            await watchAsync(redisKey);

            let currentStock = await getAsync(redisKey);

            if (currentStock === null) {
            
                await setAsync(redisKey, inventoryItem.inven_stock);
                currentStock = inventoryItem.inven_stock;
            } else {
                currentStock = parseInt(currentStock, 10);
            }

            if (currentStock < quantity) {
                await unwatchAsync();
                throw new Error('Không đủ hàng trong kho');
            }

            const multi = redisClient.multi();
            multi.decrby(redisKey, quantity);
            multi.get(redisKey);

            const results = await execMultiAsync();


            if (results === null) {
                throw new Error('Dữ liệu đã thay đổi, thử lại...');
            }

            const [_, newStock] = results;

            if (parseInt(newStock, 10) < 0) {
                await incrByAsync(redisKey, quantity);
                throw new Error('Không đủ hàng trong kho');
            }

            const updatedInventoryItem = await inventory.findOneAndUpdate(
                {
                    _id: inventoryItem._id,
                    inven_stock: { $gte: quantity }
                },
                {
                    $inc: {
                        inven_stock: -quantity,
                        inven_version: 1
                    },
                    $push: {
                        inven_reservations: {
                            quantity,
                            cartId,
                            createdOn: new Date()
                        }
                    }
                },
                {
                    new: true,
                    session
                }
            );

            if (!updatedInventoryItem) {
                await incrByAsync(redisKey, quantity);
                throw new Error('Không thể cập nhật kho, thử lại...');
            }

            await session.commitTransaction();
            return { modifiedCount: 1, newStock: parseInt(newStock, 10) };
        } catch (error) {
            await session.abortTransaction();
            retryCount++;
            if (retryCount >= maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        } finally {
            session.endSession();
            await unwatchAsync();
        }
    }
};


const syncInventory = async (productId) => {
    const inventoryItem = await inventory.findOne({
        inven_productId: mongoose.Types.ObjectId(productId)
    });

    if (inventoryItem) {
        const redisKey = `inventory:${inventoryItem._id}`;
        await setAsync(redisKey, inventoryItem.inven_stock);
    }
};

module.exports = {
    reservationInventoryV2,
    syncInventory
};