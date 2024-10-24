'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');

const shopController = require('../../controllers/shop.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();
router.post('/search',asyncHandler(shopController.searchShop))

router.use(authenticationV2)
router.post('/update-profile',asyncHandler(shopController.updateProfile))
router.patch('/change-password',asyncHandler(shopController.changePassword))
router.put('/forgot-password',asyncHandler(shopController.forgotPassword))
router.put('/reset-password',asyncHandler(shopController.resetPassword))
router.get('/analytics',asyncHandler(shopController.getShopAnalytics))
router.put('/update-status',asyncHandler(shopController.updateShopStatus))
router.get('/advance-analytics',asyncHandler(shopController.getDetailedShopAnalytics))
router.get('/inventory-analytics',asyncHandler(shopController.getInventoryAnalytics))


module.exports = router;