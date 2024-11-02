'use strict'

const express = require('express');
const asyncHandler = require('../../helpers/asyncHandler');
const roleController = require('../../controllers/role.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const { isAdmin } = require('../../auth/checkRole');

const router = express.Router();


router.use(authenticationV2);

//router.use(isAdmin);

router.post('/', asyncHandler(roleController.createRole));
router.get('/', asyncHandler(roleController.getAllRoles));
router.get('/:id', asyncHandler(roleController.getRoleById));
router.put('/:id', asyncHandler(roleController.updateRole));
router.delete('/:id', asyncHandler(roleController.deleteRole));

router.patch('/:id/status', asyncHandler(roleController.updateRoleStatus));
router.patch('/:id/grants', asyncHandler(roleController.updateRoleGrants));

module.exports = router;