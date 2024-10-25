'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');

const roomController = require('../../controllers/room.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

router.use(authenticationV2)
router.post('/', asyncHandler(roomController.createRoom));
router.get('/user', asyncHandler(roomController.getRoomsByUser));
router.get('/shop', asyncHandler(roomController.getRoomsByShop));
router.get('/:shopId', asyncHandler(roomController.getRoom));
router.delete('/:roomId', asyncHandler(roomController.deleteRoom));


module.exports = router;