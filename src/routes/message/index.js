'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');

const messageController = require('../../controllers/message.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

router.use(authenticationV2)

router.post('/send', asyncHandler(messageController.sendMessage));
router.get('/:roomId', asyncHandler(messageController.getMessagesByRoom));
router.put('/:roomId/read', asyncHandler(messageController.markMessagesAsRead));
router.get('/:roomId/unread', asyncHandler(messageController.getUnreadCount));

module.exports = router;