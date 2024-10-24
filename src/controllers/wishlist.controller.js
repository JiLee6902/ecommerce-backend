'use strict'






const { SuccessResponse } = require('../core/success.response');
const WishlistService = require('../models/repositories/wishlist.repo');

class WishlistController {

    addToWishlist = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Discount success',
            metadata: await WishlistService.addToWishlist(
                {
                    userId: req.user.userId,
                    productId: req.params.productId
                }
            )
        }).send(res);
    }

    removeFromWishlist = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all Discount with Shop success',
            metadata: await WishlistService.removeFromWishlist(
                {
                    userId: req.user.userId,
                    productId: req.params.productId
                }
            )
        }).send(res);
    }

    getWishlist = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Discount amount success',
            metadata: await WishlistService.getWishlist(
                req.user.userId
            )
        }).send(res);
    }

    clearWishlist = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all Discount with Product success',
            metadata: await WishlistService.clearWishlist(
                req.user.userId
            )
        }).send(res);
    }
}

module.exports = new WishlistController()