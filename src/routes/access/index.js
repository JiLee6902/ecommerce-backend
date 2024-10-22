'use strict'

const express= require('express');
const accessController = require('../../controllers/access.controller');
const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

router.post('/shop/signup', asyncHandler(accessController.signUpShop))
router.post('/user/signup', asyncHandler(accessController.signUpUser))

router.post('/shop/login', asyncHandler(accessController.login))
router.post('/user/login', asyncHandler(accessController.login))

router.post('/user/login-google', asyncHandler(accessController.loginWithGoogle))
router.post('/user/login-facebook', asyncHandler(accessController.loginWithFacebook))


//authentication
router.use(authenticationV2)

router.post('/shop/logout', asyncHandler(accessController.logout))
router.post('/shop/handlerRefreshToken', asyncHandler(accessController.handlerRefreshToken))



module.exports = router;