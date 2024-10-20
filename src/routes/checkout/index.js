'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const checkoutController = require('../../controllers/checkout.controller');

const router = express.Router();


router.post('/review', asyncHandler(checkoutController.checkoutReview))

router.use(authenticationV2)
router.get('/get-order', asyncHandler(checkoutController.getOneOrderByUser))
router.get('/get-orders', asyncHandler(checkoutController.getOrdersByUser))

router.patch('/cancel-order', asyncHandler(checkoutController.cancelOrder))
router.patch('/update-status-order', asyncHandler(checkoutController.updateOrderStatus))

module.exports = router;