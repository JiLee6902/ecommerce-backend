const express = require('express');
const adminController = require('../../controllers/admin.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const asyncHandler = require('../../helpers/asyncHandler');
const { checkAdmin } = require('../../auth/authUtils');

const router = express.Router();
router.use(authenticationV2);
router.use(checkAdmin);

router.post('/categories', asyncHandler(adminController.createCategory));
router.put('/categories/:categoryId', asyncHandler(adminController.updateCategory));
router.delete('/categories/:categoryId', asyncHandler(adminController.deleteCategory));

router.post('/shops/:shopId/ban', asyncHandler(adminController.banShop));
router.post('/shops/:shopId/unban', asyncHandler(adminController.unbanShop));
router.get('/users', asyncHandler(adminController.getAllUsers));
router.get('/users/:userId', asyncHandler(adminController.getUserDetails));
router.put('/users/:userId/role', asyncHandler(adminController.updateUserRole));


// Thống kê
router.get('/shops/top-selling', asyncHandler(adminController.getTopSellingShops));
router.get('/shops/statistics', asyncHandler(adminController.getShopStatistics));


// Phân tích sản phẩm và đơn hàng
router.get('/analytics/products', asyncHandler(adminController.getProductAnalytics));
router.get('/analytics/orders', asyncHandler(adminController.getOrderAnalytics));

// Quản lý sản phẩm
router.put('/products/:productId/visibility', asyncHandler(adminController.manageProductVisibility));
router.get('/system/health', asyncHandler(adminController.getSystemHealth));

module.exports = router;