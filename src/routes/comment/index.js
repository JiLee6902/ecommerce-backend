'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const commentController = require('../../controllers/comment.controller');

const router = express.Router();

router.use(authenticationV2)

router.post('', asyncHandler(commentController.createComment))
router.get('', asyncHandler(commentController.getCommentsByParentId))
router.delete('', asyncHandler(commentController.deleteComment))
router.get('/product/:productId/shop/:shopId', asyncHandler(commentController.getCommentsByProduct));
router.get('/stats/shop/:shopId', asyncHandler(commentController.getCommentStatsByShop));
router.get('/count/product/:productId', asyncHandler(commentController.getCommentCount));


module.exports = router;