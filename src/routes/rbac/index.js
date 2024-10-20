'use strict'

const express = require('express');
const asyncHandler = require('../../helpers/asyncHandler');
const { newRole, listRoles, newResource, listResources } = require('../../controllers/rbac.controller');
const router = express.Router();

// route này của admin
router.post('/role', asyncHandler(newRole))
router.get('/roles', asyncHandler(listRoles))

router.post('/resource', asyncHandler(newResource))
router.get('/resources', asyncHandler(listResources))

module.exports = router;