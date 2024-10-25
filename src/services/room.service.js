'use strict'

const { BadRequestError, AuthFailureError } = require('../core/error.response');
const Room = require('../models/room.model');

class RoomService {
    static async createRoom(userId, shopId) {
        const existingRoom = await Room.findOne({
            user: userId,
            shop: shopId,
            isDeleted: false
        });

        if (existingRoom) return existingRoom;

        const newRoom = await Room.create({ 
            user: userId, 
            shop: shopId,
            lastUserActivity: new Date(),
        });

        return newRoom;
    }

    static async getRoomsByUser(userId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await Room.find({ 
            user: userId,
            isDeleted: false
        })
        .populate('shop', 'name avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }


    static async getRoomsByShop(shopId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await Room.find({ 
            shop: shopId,
            isDeleted: false
        })
        .populate('user', 'usr_name usr_avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }


    static async getRoom(userId, shopId) {
        return await Room.findOne({ 
            user: userId, 
            shop: shopId,
            isDeleted: false
        })
        .populate('user', 'usr_name usr_avatar')
        .populate('shop', 'name avatar')
        .populate('lastMessage')
        .lean();
    }

     static async getRoomById(roomId) {
        return await Room.findOne({ 
            _id: roomId,
            isDeleted: false
        });
    }

  

    static async deleteRoom(roomId, userId, userType) {
        const room = await Room.findById(roomId);
        if (!room) throw new BadRequestError('Room not found');

        const isAuthorized = userType === 'user'
            ? room.user.toString() === userId.toString()
            : room.shop.toString() === userId.toString();

        if (!isAuthorized) {
            throw new AuthFailureError('Unauthorized to delete this room');
        }

        await Room.findByIdAndUpdate(roomId, {
            isDeleted: true,
            deletedBy: userId,
            deletedByType: userType,
            deletedAt: new Date()
        });
    }

}

module.exports = RoomService;