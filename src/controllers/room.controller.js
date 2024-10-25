'use strict'

const { SuccessResponse } = require('../core/success.response');
const RoomService = require('../services/room.service');

class RoomController {
    createRoom = async (req, res, next) => {
        const { shopId } = req.body;
        const { userId } = req.user;

        new SuccessResponse({
            message: 'Create room success',
            metadata: await RoomService.createRoom(userId, shopId)
        }).send(res);
    }

    getRoomsByUser = async (req, res, next) => {
        const { userId } = req.user;
        const { limit = 20, page = 1 } = req.query;

        new SuccessResponse({
            message: 'Get rooms success',
            metadata: await RoomService.getRoomsByUser(userId, parseInt(limit), parseInt(page))
        }).send(res);
    }

    getRoomsByShop = async (req, res, next) => {
        const { userId: shopId } = req.user;
        const { limit = 20, page = 1 } = req.query;

        new SuccessResponse({
            message: 'Get rooms success',
            metadata: await RoomService.getRoomsByShop(shopId, parseInt(limit), parseInt(page))
        }).send(res);
    }

    getRoom = async (req, res, next) => {
        const { shopId } = req.params;
        const { userId } = req.user;

        new SuccessResponse({
            message: 'Get room success',
            metadata: await RoomService.getRoom(userId, shopId)
        }).send(res);
    }

    deleteRoom = async (req, res, next) => {
        const { roomId } = req.params;
        const { userId, userType } = req.user;

        new SuccessResponse({
            message: 'Delete room success',
            metadata: await RoomService.deleteRoom(roomId, userId, userType)
        }).send(res);
    }
}

module.exports = new RoomController()
