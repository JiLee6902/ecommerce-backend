'use strict'

const { SuccessResponse } = require('../core/success.response');
const InventoryService = require('../services/inventory.service');

class InventoryController {

    addStockToInventory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Add stock success',
            metadata: await InventoryService.addStockToInventory(
                req.body
            )
        }).send(res);
    }
    updateInventoryStock = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update stock success',
            metadata: await InventoryService.updateInventoryStock(
                {
                    shopId: req.user.userId,
                    ...req.body
                }
            )
        }).send(res);
    }
}

module.exports = new InventoryController()