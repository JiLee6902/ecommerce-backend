'use strict';

const orderConsumer = require('./orderConsumer');
const notificationConsumer = require('./notificationConsumer');
const notificationDLQConsumer = require('./notificationDLQConsumer');
const inventoryConsumer = require('./inventory.Consummer');

const startWorkers = () => {
    orderConsumer();
    inventoryConsumer();
    notificationConsumer();
    notificationDLQConsumer();
};

module.exports = startWorkers;