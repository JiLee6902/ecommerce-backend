'use-strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Shop = require('../models/shop.model');
const Order = require('../models/order.model');
const Staff = require('../models/staff.model');
const { product } = require('../models/staff.model');

const { BadRequestError, AuthFailureError } = require('../core/error.response');
const { sendEmailForgotPassword } = require("./email.service");

class ShopService {
    static async updateInformation(shopId, updateData) {
        const { email, ...otherData } = updateData;
        if (email) {
            throw new BadRequestError('Email cannot be changed');
        }

        const updatedShop = await Shop.findByIdAndUpdate(shopId, otherData, { new: true });
        if (!updatedShop) {
            throw new BadRequestError('Shop not found');
        }

        return updatedShop;
    }

    static async changePassword({ shopId, currentPassword, newPassword }) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, shop.password);
        if (!isMatch) {
            throw new AuthFailureError('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        shop.password = hashedPassword;
        await shop.save();

        return { message: 'Password changed successfully' };
    }

    static async forgotPassword({ email }) {
        const shop = await Shop.findOne({ email });
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        shop.resetPasswordToken = resetToken;
        shop.resetPasswordExpires = Date.now() + 3600000;
        await shop.save();

        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`
        await sendEmailForgotPassword({
            email,
            resetLink
        })

        return { message: 'Password reset email sent' };
    }

    static async resetPassword({ token, newPassword }) {
        const shop = await Shop.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!shop) {
            throw new BadRequestError('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        shop.password = hashedPassword;
        shop.resetPasswordToken = undefined;
        shop.resetPasswordExpires = undefined;
        await shop.save();

        return { message: 'Password reset successfully' };
    }

    static async getShopAnalytics(shopId) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        const totalProducts = await product.countDocuments({ product_shop: shopId });

        const orders = await Order.find({ 'order_products.shopId': shopId });
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + order.order_checkout.totalCheckout;
        }, 0);

        const totalStaff = await Staff.countDocuments({ staff_shop: shopId });

        const topProducts = await product.find({ product_shop: shopId })
            .sort({ total_sales_count: -1 })
            .limit(5);

        return {
            totalProducts,
            totalRevenue,
            totalStaff,
            topProducts,
            total_sales: shop.total_sales
        };
    }

    static async updateShopStatus({shopId, status}) {
        const validStatuses = ['active', 'inactive', 'banned'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError('Invalid status');
        }

        const shop = await Shop.findByIdAndUpdate(
            shopId,
            { status },
            { new: true }
        );

        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        if (status === 'banned') {
            await Staff.updateMany(
                { staff_shop: shopId },
                { staff_status: 'terminated' }
            );
        }

        return shop;
    }

    static async getDetailedShopAnalytics(shopId) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        // Phân tích doanh thu theo thời gian
        const revenueAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId)
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$order_checkout.totalCheckout' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$order_checkout.totalCheckout' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        // Phân tích sản phẩm bán chạy
        const productAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId)
                }
            },
            { $unwind: '$order_products' },
            { $unwind: '$order_products.item_products' },
            {
                $group: {
                    _id: '$order_products.item_products.productId',
                    totalQuantitySold: { $sum: '$order_products.item_products.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: ['$order_products.item_products.price', '$order_products.item_products.quantity']
                        }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'Products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 }
        ]);

        // Phân tích đơn hàng theo trạng thái
        const orderStatusAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId)
                }
            },
            {
                $group: {
                    _id: '$order_status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$order_checkout.totalCheckout' }
                }
            }
        ]);

        // Phân tích phương thức thanh toán
        const paymentAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId)
                }
            },
            {
                $group: {
                    _id: '$order_payment.method',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$order_checkout.totalCheckout' }
                }
            }
        ]);

        // Phân tích tỷ lệ hoàn đơn và hủy đơn
        const cancelrationAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId),
                    'order_status': { $in: ['cancelled'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    cancelledCount: { $sum: 1 },
                    totalValue: { $sum: '$order_checkout.totalCheckout' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        const successrationAnalysis = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId),
                    'order_status': { $in: ['success'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    cancelledCount: { $sum: 1 },
                    totalValue: { $sum: '$order_checkout.totalCheckout' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        return {
            revenueAnalysis,
            productAnalysis,
            orderStatusAnalysis,
            paymentAnalysis,
            cancelrationAnalysis,
            successrationAnalysis,
            summary: {
                totalRevenue: revenueAnalysis.reduce((acc, curr) => acc + curr.totalRevenue, 0),
                topSellingProduct: productAnalysis[0]?.productDetails[0]?.product_name || 'N/A',
                cancelRate: (orderStatusAnalysis.find(x => x._id === 'cancelled')?.count || 0) /
                    orderStatusAnalysis.reduce((acc, curr) => acc + curr.count, 0),
                successRate: (orderStatusAnalysis.find(x => x._id === 'success')?.count || 0) /
                    orderStatusAnalysis.reduce((acc, curr) => acc + curr.count, 0)
            }
        };
    }

    static async getInventoryAnalytics(shopId) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }
        // Phân tích tồn kho theo danh mục
        const inventoryByCategory = await product.aggregate([
            {
                $match: {
                    product_shop: convertToObjectIdMongoDb(shopId)
                }
            },
            {
                $group: {
                    _id: '$product_category',
                    totalProducts: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$product_price', '$product_quantity'] } }
                }
            },
            {
                $lookup: {
                    from: 'Categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            }
        ]);

        // Phân tích sản phẩm sắp hết hàng
        const lowStockProducts = await product.find({
            product_shop: convertToObjectIdMongoDb(shopId),
            product_quantity: { $lt: 10 }
        }).sort({ product_quantity: 1 }).limit(20);

        // Phân tích xu hướng tồn kho
        const inventoryTrends = await Order.aggregate([
            {
                $match: {
                    'order_products.shopId': convertToObjectIdMongoDb(shopId)
                }
            },
            { $unwind: '$order_products' },
            { $unwind: '$order_products.item_products' },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        productId: '$order_products.item_products.productId'
                    },
                    totalSold: { $sum: '$order_products.item_products.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'Products',
                    localField: '_id.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, totalSold: 1 } }
        ]);
        return {
            inventoryByCategory,
            lowStockProducts,
            inventoryTrends,
            summary: {
                totalCategories: inventoryByCategory.length,
                totalProductsLowStock: lowStockProducts.length,
            }
        };
    }


}

module.exports = ShopService;