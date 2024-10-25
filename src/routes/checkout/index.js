'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const { grantAccess } = require('../../middlewares/rbac');
const checkoutController = require('../../controllers/checkout.controller');

const router = express.Router();


router.post('/review', asyncHandler(checkoutController.checkoutReview))

router.use(authenticationV2)

router.get('/:orderId/:userId',  grantAccess('readOwn', 'checkout', { strict: true }), asyncHandler(checkoutController.getOneOrderByUser));
router.get('/:userId/get-all-orders',  grantAccess('readOwn', 'checkout'), asyncHandler(checkoutController.getOrdersByUser));

router.patch('/:orderId/:userId/cancel', grantAccess('updateOwn', 'checkout', { strict: true }), asyncHandler(checkoutController.cancelOrder));
router.patch('/:orderId/status', grantAccess('updateOwn', 'checkout', { strict: true }) , asyncHandler(checkoutController.updateOrderStatus));
router.put('/payment_confirm',  grantAccess('readOwn', 'checkout', { strict: true }), asyncHandler(checkoutController.paymentOrder));


module.exports = router;