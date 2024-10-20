const AdminService = require('../services/admin.service');
const { SuccessResponse } = require('../core/success.response');

class AdminController {
    banShop = async (req, res, next) => {
        try {
            const bannedShop = await AdminService.banShop(req.user.userId, req.params.shopId);
            new SuccessResponse({
                message: 'Ban Shop success',
                metadata: bannedShop
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    unbanShop = async (req, res, next) => {
        try {
            const unbannedShop = await AdminService.unbanShop(req.user.userId, req.params.shopId);
            new SuccessResponse({
                message: 'Unban Shop success',
                metadata: unbannedShop
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getTopSellingShops = async (req, res, next) => {
        try {
            const topShops = await AdminService.getTopSellingShops(req.user.userId, req.query.limit);
            new SuccessResponse({
                message: 'Get top selling shops success',
                metadata: topShops
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getShopStatistics = async (req, res, next) => {
        try {
            const statistics = await AdminService.getShopStatistics(req.user.userId);
            new SuccessResponse({
                message: 'Get shop statistics success',
                metadata: statistics
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
    getAllUsers = async (req, res, next) => {
        try {
            const result = await AdminService.getAllUsers(req.user.userId, req.query);
            new SuccessResponse({
                message: 'Get all users success',
                metadata: result
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getUserDetails = async (req, res, next) => {
        try {
            const user = await AdminService.getUserDetails(req.user.userId, req.params.userId);
            new SuccessResponse({
                message: 'Get user details success',
                metadata: user
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    updateUserRole = async (req, res, next) => {
        try {
            const updatedUser = await AdminService.updateUserRole(req.user.userId, req.params.userId, req.body.newRole);
            new SuccessResponse({
                message: 'Update user role success',
                metadata: updatedUser
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getProductAnalytics = async (req, res, next) => {
        try {
            const analytics = await AdminService.getProductAnalytics(req.user.userId);
            new SuccessResponse({
                message: 'Get product analytics success',
                metadata: analytics
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getOrderAnalytics = async (req, res, next) => {
        try {
            const analytics = await AdminService.getOrderAnalytics(req.user.userId, req.query);
            new SuccessResponse({
                message: 'Get order analytics success',
                metadata: analytics
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    manageProductVisibility = async (req, res, next) => {
        try {
            const product = await AdminService.manageProductVisibility(req.user.userId, req.params.productId, req.body.isVisible);
            new SuccessResponse({
                message: 'Manage product visibility success',
                metadata: product
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getSystemHealth = async (req, res, next) => {
        try {
            const healthData = await AdminService.getSystemHealth(req.user.userId);
            new SuccessResponse({
                message: 'Get system health success',
                metadata: healthData
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    getAuditLogs = async (req, res, next) => {
        try {
            const logs = await AdminService.getAuditLogs(req.user.userId, req.query);
            new SuccessResponse({
                message: 'Get audit logs success',
                metadata: logs
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
    getSystemHealth = async (req, res, next) => {
        try {
            const healthData = await AdminService.getSystemHealth(req.user.userId);
            new SuccessResponse({
                message: 'Get system health success',
                metadata: healthData
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();