'use strict'

const { SuccessResponse } = require('../core/success.response');
const CommentService = require('../services/comment.service');

class CheckoutController {

    createComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new comment success',
            metadata: await CommentService.createComment(
                req.body
            )
        }).send(res);
    }

    getCommentsByParentId = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new comment success',
            metadata: await CommentService.getCommentsByParentId(
                req.query
            )
        }).send(res);
    }

    deleteComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new comment success',
            metadata: await CommentService.deleteComment(
                req.body
            )
        }).send(res);
    }

    getCommentsByProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get comments by product success',
            metadata: await CommentService.getCommentsByProduct(
                req.params.productId,
                req.params.shopId,
                req.query.limit,
                req.query.offset
            )
        }).send(res);
    }

    getCommentStatsByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get comment stats by shop success',
            metadata: await CommentService.getCommentStatsByShop(req.params.shopId)
        }).send(res);
    }

    getCommentCount = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get comment count success',
            metadata: await CommentService.getCommentCount(req.params.productId)
        }).send(res);
    }
}

module.exports = new CheckoutController()