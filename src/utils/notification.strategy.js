'use strict';


class NotificationStrategy {
    generateContent(sender) {
        throw new Error('generateContent() phải được triển khai!');
    }
}

class ShopAddedProductStrategy extends NotificationStrategy {
    generateContent(sender) {
        return `${sender} vừa mới thêm một sản phẩm: ${sender}`;
    }
}

class PromotionAddedStrategy extends NotificationStrategy {
    generateContent(sender) {
        return `${sender} vừa mới thêm một voucher: ${sender}`;
    }
}

module.exports = {
    ShopAddedProductStrategy,
    PromotionAddedStrategy
};
