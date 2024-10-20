'use strict'

const Room = require('../models/room.model');

class RoomService {
    static async createRoom(userId, shopId) {
        const existingRoom = await Room.findOne({ user: userId, shop: shopId });
        if (existingRoom) {
            return existingRoom;
        }
        const newRoom = new Room({ user: userId, shop: shopId });
        return await newRoom.save();
    }

    static async getRoomsByUser(userId) {
        return await Room.find({ user: userId }).populate('shop', 'usr_name');
    }

    static async getRoomsByShop(shopId) {
        return await Room.find({ shop: shopId }).populate('user', 'name');
    }

    static async getRoom(userId, shopId) {
        return await Room.findOne({ user: userId, shop: shopId });
    }
}

module.exports = RoomService;