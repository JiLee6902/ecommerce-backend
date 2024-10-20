const express = require('express');
const categoryController = require('../../controllers/category.controller');
const asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

router.get('/search', asyncHandler(categoryController.searchCategories))
router.get('/type/:type', asyncHandler(categoryController.getCategoriesByType))
router.get('/gender/:gender', asyncHandler(categoryController.getCategoriesByGender))
router.get('/slug/:slug', asyncHandler(categoryController.getCategoryBySlug))
router.get('/products/:categoryId', asyncHandler(categoryController.filterProductsByCategory))
router.get('/:categoryId', asyncHandler(categoryController.getCategoryById))
router.get('/', asyncHandler(categoryController.getAllCategories))

router.use(authenticationV2)

router.post('/', asyncHandler(categoryController.createCategory))
router.patch('/:categoryId', asyncHandler(categoryController.updateCategory))
router.delete('/:categoryId', asyncHandler(categoryController.deleteCategory))
router.get('/children/:parentId', asyncHandler(categoryController.getChildCategories))

module.exports = router;