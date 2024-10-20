'use strict'

const { NOTI } = require("../models/notification.model");
const { convertToObjectIdMongoDb } = require("../utils");

const pushNotiToSystem = async ({
    type = 'SHOP-001',
    receivedId = 1,
    senderId = 1,
    options = {}
}) => {
    let noti_content;
    if (type == 'SHOP-001') {
        noti_content = `@@@ vừa mới thêm một sản phẩm: @@@`
    } else if (type == 'PROMOTION-001') {
        noti_content = `@@@ vừa mới thêm một voucher: @@@`
    }

    const newNoti = await NOTI.create({
        noti_type: type,
        noti_content: noti_content,
        noti_senderId: senderId,
        noti_receivedId: receivedId,
        noti_options: options
    })

    return newNoti;
}

const listNotiByUser = async ({
    userId = 1,
    type = 'ALL',
    isRead = 0
}) => {
    const match = { noti_receivedId: userId }
    if (type !== 'ALL') {
        match['noti_type'] = type
    }

    return await NOTI.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: 'Shops', 
                localField: 'noti_senderId',
                foreignField: '_id',
                as: 'sender'
            }
        },
        {
            $addFields: {
                shop_name: { $arrayElemAt: ['$sender.name', 0] }
            }
        },
        {
            $project: {
                noti_type: 1,
                noti_content: {
                    $concat: [  
                        {
                            $substr: ['$shop_name', 0, -1]

                        },
                        ' vừa mới thêm sản phẩm mới: '
                        , {
                            $substr: ['$noti_options.product_name', 0, { $strLenCP: '$noti_options.product_name' }]                      
                        }
                    ]
                },
                noti_senderId: 1,
                noti_receivedId: 1,
                createdAt: 1,
                noti_options: 1,
                shop_name: 1
            }
        }
    ])
}

const listAllNoti = async ({
    id
}) => {
    const listNoti = await NOTI.find({ noti_receivedId: convertToObjectIdMongoDb(id) },
        'noti_type noti_senderId noti_receivedId noti_content noti_options', {
        }
    ).sort({ createdAt: -1 }).lean().exec();
    return listNoti;
}

const listNotiNotRead = async (
    { id }
) => {
    const unreadNotifications = await NOTI.find({ noti_receivedId: convertToObjectIdMongoDb(id), isRead: false }).sort({ createdAt: -1 });

    if (unreadNotifications.length > 0) {
        const notificationData = unreadNotifications.map(noti => ({
            action: noti.noti_content,
            receivedId: noti.noti_receivedId,
            senderId: noti.noti_senderId,
            options: noti.noti_options,
            timestamp: noti.createdAt
        }))

        return notificationData
    }

    const arrayEmpty = [];
    return arrayEmpty;
}

const createNotiSocket = async ({
    type, senderId, senderModel, receivedId, receivedModel,content, options
}) => {
    const notiNew = await NOTI.create({
        noti_type: type,
        noti_senderId: senderId,
        noti_senderModel: senderModel,
        noti_receivedId: receivedId,
        noti_receivedModel: receivedModel,
        noti_content: `Thông báo: ${content}.`,
        noti_options: options
    });

    return {
        noti_content: notiNew.noti_content,
        noti_options: notiNew.noti_options , 
        noti_receivedId: notiNew.noti_receivedId,
        noti_senderId: notiNew.noti_senderId,
        timestamp: notiNew.createdAt 
    };
}
const updateStatusNoti = async (
    id
) => {
    await NOTI.updateMany({ noti_receivedId: convertToObjectIdMongoDb(id), isRead: false }, { $set: { isRead: true } });
}

module.exports = {
    pushNotiToSystem,
    listNotiByUser,
    listAllNoti,
    listNotiNotRead,
    createNotiSocket,
    updateStatusNoti
}