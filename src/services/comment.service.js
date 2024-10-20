'use strict'


const { NotFoundError } = require('../core/error.response');
const Comment = require('../models/comment.model');
const Shop = require('../models/shop.model');

const { convertToObjectIdMongoDb } = require('../utils');
const { findProduct } = require('./product.service');

/*
  key features: Comment Service
  + add [User, Shop]
  + get list [User, Shop]
  + delete a comment [User, Shop, Admin]
*/
class CommentService {

    static async createComment({
        productId, userId, content, parentCommentId = null
    }) {
        const comment = new Comment({
            comment_productId: productId,
            comment_userId: userId,
            comment_content: content,
            comment_parentId: parentCommentId,
        })

        let rightValue;
        if (parentCommentId) {
            const parentComment = await Comment.findById(convertToObjectIdMongoDb(parentCommentId))
            if (!parentComment) throw new NotFoundError(`Don't have that Comment_Id`);
            rightValue = parentComment.comment_right;

            await Comment.updateMany(
                {
                    comment_productId: convertToObjectIdMongoDb(productId),
                    comment_right: { $gte: rightValue }
                },
                { $inc: { comment_right: 2 } }
            );

            await Comment.updateMany(
                {
                    comment_productId: convertToObjectIdMongoDb(productId),
                    comment_left: { $gt: rightValue }
                },
                { $inc: { comment_left: 2 } }
            );

        } else {
            const maxRightValue = await Comment.findOne({
                comment_productId: convertToObjectIdMongoDb(productId)
            }, 'comment_right', { sort: { comment_right: -1 } })

            if (maxRightValue) {
                rightValue = maxRightValue.comment_right + 1;
            } else {
                rightValue = 1;
            }
        }

        comment.comment_left = rightValue;
        comment.comment_right = rightValue + 1;

        await comment.save();
        return comment;
    }

    static async getCommentsByParentId({
        productId,
        parentCommentId = null,
        limit = 50,
        offset = 0,
    }) {
        if (parentCommentId) {
            const parent = await Comment.findById(parentCommentId)
            if (!parent) throw new NotFoundError(`Don't have that Comment_Id`);

            const comments = await Comment.find({
                comment_productId: productId,
                comment_left: { $gt: parent.comment_left },
                comment_right: { $lte: parent.comment_right }
            })
                .select({
                    comment_left: 1,
                    comment_right: 1,
                    comment_content: 1,
                    comment_parentId: 1
                })
                .sort({
                    comment_left: 1
                })

            return comments
        }



        const comments = await Comment.find({
            comment_productId: convertToObjectIdMongoDb(productId),
            comment_parentId: parentCommentId
        })
            .select({
                comment_left: 1,
                comment_right: 1,
                comment_content: 1,
                comment_parentId: 1
            })
            .sort({
                comment_left: 1
            })

        return comments
    }

    static async deleteComment({
        commentId, productId
    }) {
        //check product
        const foundProduct = await findProduct({ product_id: productId })
        if (!foundProduct) {
            throw new NotFoundError('Product not found!')
        }

        //xđ left-right parent of this commentId
        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new NotFoundError('Comment not found!')
        }

        const leftValue = comment.comment_left;
        const rightValue = comment.comment_right;
        const width = rightValue - leftValue + 1;

        await Comment.deleteMany({
            comment_productId: productId,
            comment_left: { $gte: leftValue, $lte: rightValue },
        })

        await Comment.updateMany({
            comment_productId: productId,
            comment_right: { $gt: rightValue }
        }, {
            $inc: {
                comment_right: -width,
            }
        })

        await Comment.updateMany({
            comment_productId: productId,
            comment_left: { $gt: rightValue }
        }, {
            $inc: {
                comment_left: -width,
            }
        })
        return true;
    }

    static async getCommentsByProduct(productId, shopId, limit = 50, offset = 0) {
        if (!productId || !shopId) {
            throw new BadRequestError('Product ID and Shop ID are required');
        }

        const shop = await Shop.findById(shopId);
        if (!shop || shop.status !== 'active') {
            throw new NotFoundError('Shop not found or inactive');
        }

        const product = await findProduct({ product_id: productId });
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        if (product.product_shop.toString() !== shopId) {
            throw new ForbiddenError('This product does not belong to the specified shop');
        }

        const comments = await Comment.find({ comment_productId: convertToObjectIdMongoDb(productId) })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate('comment_userId', 'name')  
            .lean();

        return comments;
    }

    static async getCommentStatsByShop(shopId) {
        if (!shopId) {
            throw new BadRequestError('Shop ID is required');
        }

        const shop = await Shop.findById(shopId);
        if (!shop || shop.status !== 'active') {
            throw new NotFoundError('Shop not found or inactive');
        }

        const stats = await Comment.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'comment_productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $match: {
                    'product.product_shop': convertToObjectIdMongoDb(shopId)
                }
            },
            {
                $group: {
                    _id: '$comment_productId',
                    totalComments: { $sum: 1 },
                    latestComment: { $max: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalComments: 1,
                    latestComment: 1,
                    productName: { $arrayElemAt: ['$productDetails.product_name', 0] }
                }
            },
            {
                $sort: { totalComments: -1 }
            }
        ]);

        return stats;
    }

    static async getCommentCount(productId) {
        if (!productId) {
            throw new BadRequestError('Product ID is required');
        }

        const product = await findProduct({ product_id: productId });
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        const shop = await Shop.findById(product.product_shop);
        if (!shop || shop.status !== 'active') {
            throw new ForbiddenError('Cannot retrieve comment count for products from inactive shops');
        }

        const count = await Comment.countDocuments({
            comment_productId: convertToObjectIdMongoDb(productId)
        });

        return count;
    }
}

module.exports = CommentService


