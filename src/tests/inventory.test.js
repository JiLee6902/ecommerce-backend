const redisPubsubService = require("../services/redisPubsub.service");


class InventoryServiceTest {
    constructor() {
        redisPubsubService.subscribe('purchase_events', (channel, message) => {
            console.log("Received message", message)
            InventoryServiceTest.updateInventory(JSON.parse(message));
        })
    }
    static updateInventory({ productId, quantity }) {
        console.log(`Update inventory ${productId} with quantity ${quantity}`)
    }
}

module.exports = new InventoryServiceTest();

