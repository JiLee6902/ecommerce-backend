'use strict';

const {
    ShopAddedProductStrategy,
    PromotionAddedStrategy
} = require('../utils/notification.strategy');

const pushNotiToSystem = async ({
    type = 'SHOP-001',
    receivedId = 1,
    senderId = 1,
    options = {}
}) => {
    let strategy;

    switch (type) {
        case 'SHOP-001':
            strategy = new ShopAddedProductStrategy();
            break;
        case 'PROMOTION-001':
            strategy = new PromotionAddedStrategy();
            break;
        default:
            throw new Error(`Unknown notification type: ${type}`);
    }

  
}

module.exports = pushNotiToSystem;
