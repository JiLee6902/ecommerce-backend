'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const checkoutController = require('../../controllers/checkout.controller');

const router = express.Router();


router.post('/review', asyncHandler(checkoutController.checkoutReview))

router.use(authenticationV2)

router.get('/:orderId/:userId', asyncHandler(checkoutController.getOneOrderByUser));
router.get('/:userId/get-all-orders', asyncHandler(checkoutController.getOrdersByUser));

router.patch('/:orderId/:userId/cancel', asyncHandler(checkoutController.cancelOrder));
router.patch('/:orderId/status', asyncHandler(checkoutController.updateOrderStatus));

module.exports = router;