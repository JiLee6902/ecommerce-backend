'use strict'

const express = require('express');
const asyncHandler = require('../../helpers/asyncHandler');
const staffController = require('../../controllers/staff.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const { grantAccess } = require('../../middlewares/rbac');

const router = express.Router();

router.post('/forgot-password', asyncHandler(staffController.forgotPassword));
router.put('/reset-password', asyncHandler(staffController.resetPassword));

router.use(authenticationV2);

//staff
router.post('/update-profile', grantAccess('updateOwn', 'staff'), asyncHandler(staffController.updateProfile));
router.patch('/change-password', grantAccess('updateOwn', 'staff'), asyncHandler(staffController.changePassword));

//shop 
router.post('/create', grantAccess('createOwn', 'staff'), asyncHandler(staffController.createStaff));
router.get('/stats', grantAccess('readOwn', 'staff'), asyncHandler(staffController.getStaffStats));
router.patch('/ban/:staffId', grantAccess('updateOwn', 'staff', { strict: true }), asyncHandler(staffController.banStaff));
router.patch('/unban/:staffId', grantAccess('updateOwn', 'staff', { strict: true }), asyncHandler(staffController.unbanStaff));
router.post('/transfer/:staffId', grantAccess('updateAny', 'staff', { strict: true }), asyncHandler(staffController.transferStaff));
router.patch('/status/:staffId', grantAccess('updateOwn', 'staff', { strict: true }), asyncHandler(staffController.updateStaffStatus));

module.exports = router;