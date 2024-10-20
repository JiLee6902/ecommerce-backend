const os = require('os');
const si = require('systeminformation');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const Category = require('../models/category.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

class AdminService {
    static async createCategory(adminId, payload) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const newCategory = await Category.create(payload);
        return newCategory;
    }

    static async updateCategory(adminId, categoryId, payload) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, payload, { new: true });
        if (!updatedCategory) {
            throw new NotFoundError('Category not found');
        }
        return updatedCategory;
    }

    static async deleteCategory(adminId, categoryId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            throw new NotFoundError('Category not found');
        }
        return { message: 'Category deleted successfully' };
    }

    static async banShop(adminId, shopId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const shop = await Shop.findByIdAndUpdate(shopId, { status: 'banned' }, { new: true });
        if (!shop) {
            throw new NotFoundError('Shop not found');
        }
        return shop;
    }

    static async unbanShop(adminId, shopId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const shop = await Shop.findByIdAndUpdate(shopId, { status: 'active' }, { new: true });
        if (!shop) {
            throw new NotFoundError('Shop not found');
        }
        return shop;
    }

    static async getTopSellingShops(adminId, limit = 5) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const topShops = await Product.aggregate([
            { $group: { _id: "$product_shop", totalSold: { $sum: "$product_sold" } } },
            { $sort: { totalSold: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'shops',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'shopInfo'
                }
            },
            { $unwind: '$shopInfo' },
            {
                $project: {
                    _id: 1,
                    shopName: '$shopInfo.name',
                    totalSold: 1
                }
            }
        ]);

        return topShops;
    }

    static async getShopStatistics(adminId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const totalShops = await Shop.countDocuments();
        const activeShops = await Shop.countDocuments({ status: 'active' });
        const bannedShops = await Shop.countDocuments({ status: 'banned' });

        return {
            totalShops,
            activeShops,
            bannedShops
        };
    }

    static async getAllUsers(adminId, { page = 1, limit = 20, sort = 'createdAt', filter = {} }) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const skip = (page - 1) * limit;
        const sortOptions = sort.split(',').reduce((acc, item) => {
            const [key, value] = item.split(':');
            acc[key] = value === 'desc' ? -1 : 1;
            return acc;
        }, {});

        const users = await User.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .select('-usr_password -usr_salt');

        const total = await User.countDocuments(filter);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async getUserDetails(adminId, userId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const user = await User.findById(userId).select('-usr_password -usr_salt');
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    static async updateUserRole(adminId, userId, newRole) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const user = await User.findByIdAndUpdate(userId, { usr_role: newRole }, { new: true })
            .select('-usr_password -usr_salt');
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    static async getProductAnalytics(adminId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const totalProducts = await Product.countDocuments();
        const productsByCategory = await Product.aggregate([
            { $group: { _id: "$product_category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const topSellingProducts = await Product.find().sort({ product_sold: -1 }).limit(10);

        return {
            totalProducts,
            productsByCategory,
            topSellingProducts
        };
    }

    static async getOrderAnalytics(adminId, { startDate, endDate }) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const dateFilter = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const totalOrders = await Order.countDocuments(dateFilter);
        const totalRevenue = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$total_amount" } } }
        ]);

        const ordersByStatus = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const dailyOrders = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    revenue: { $sum: "$total_amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            ordersByStatus,
            dailyOrders
        };
    }

    static async manageProductVisibility(adminId, productId, isVisible) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            { isPublished: isVisible },
            { new: true }
        );

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        return product;
    }

    static async getSystemHealth(adminId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Không có quyền truy cập');
        }
    
        const cpuLoad = await si.currentLoad();
        const memoryInfo = await si.mem();
        const diskInfo = await si.fsSize();
        const uptime = os.uptime();
    
        const systemHealth = {
            cpu: cpuLoad.currentLoad,
            memory: (memoryInfo.used / memoryInfo.total) * 100,
            disk: diskInfo.reduce((acc, disk) => acc + disk.use, 0) / diskInfo.length, 
        };
    
        return systemHealth;
    }
}

module.exports = AdminService;