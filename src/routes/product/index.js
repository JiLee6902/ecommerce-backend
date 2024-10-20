'use strict'

const express = require('express');
const productController = require('../../controllers/product.controller');
const asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const validateRequest = require('../../middlewares/validate.request');
const { skuValidator } = require('../../middlewares/validate.id');
const { readCache } = require('../../middlewares/cache.middleware');
const router = express.Router();

router.get('/search', asyncHandler(productController.getListSearchProduct))
router.get('/search-product-shop', asyncHandler(productController.getListSearchProductAndTopShop))
router.get('/sku/select_variation', readCache, asyncHandler(productController.findOneSku))
router.get('/spu/get_spu_info', asyncHandler(productController.findOneSpu))
router.get('', asyncHandler(productController.findAllProducts))
router.get('/:product_id', asyncHandler(productController.findProduct))



//authentication
router.use(authenticationV2)

router.post('', asyncHandler(productController.createProduct))
router.post('/spu/new', asyncHandler(productController.createSpu))


router.patch('/:productId', asyncHandler(productController.updateProduct))

router.post('/publish/:id', asyncHandler(productController.publishProductByShop))
router.post('/unpublish/:id', asyncHandler(productController.unPublishProductByShop))



//QUERY
router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop))
router.get('/published/all', asyncHandler(productController.getAllPublishForShop))




module.exports = router;