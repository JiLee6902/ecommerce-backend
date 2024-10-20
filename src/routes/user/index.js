'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');

const userController = require('../../controllers/user.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

router.post('/new_user',asyncHandler(userController.newUser))
router.get('/welcome-back',asyncHandler(userController.checkLoginEmailToken))

router.use(authenticationV2)
router.post('/update-profile',asyncHandler(userController.updateProfile))
router.patch('/change-password',asyncHandler(userController.changePassword))
router.put('/forgot-password',asyncHandler(userController.forgotPassword))
router.put('/reset-password',asyncHandler(userController.resetPassword))
router.patch('/ban-account',asyncHandler(userController.banUser))
router.patch('/unban-account',asyncHandler(userController.unbanUser))


module.exports = router;