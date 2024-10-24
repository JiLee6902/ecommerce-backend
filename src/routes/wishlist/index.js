'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');

const WishlistController = require('../../controllers/wishlist.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

router.use(authenticationV2)
router.post('/:productId/add_to_wishlist',asyncHandler(WishlistController.addToWishlist))
router.post('/:productId/remove_to_wishlist',asyncHandler(WishlistController.removeFromWishlist))
router.get('/get_wishlist',asyncHandler(WishlistController.getWishlist))
router.put('/clear_all_wishlist',asyncHandler(WishlistController.clearWishlist))

module.exports = router;