'use strict'

const express= require('express');
const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const notificationController = require('../../controllers/notification.controller');
const router = express.Router();

router.use(authenticationV2)


router.get('', asyncHandler(notificationController.listNotiByUser));
router.get('/:id/all', asyncHandler(notificationController.listNotiNotRead));
router.get('/:id', asyncHandler(notificationController.listNotiNotRead));
router.patch('/:id/mark-as-read', asyncHandler(notificationController.listNotiByUser));




module.exports = router;