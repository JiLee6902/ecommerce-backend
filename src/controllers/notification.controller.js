'use strict'






const { SuccessResponse } = require('../core/success.response');
const NotificationService = require('../services/notification.service');


class NotificationController {
    listNotiByUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'List noti success',
            metadata: await NotificationService.listNotiByUser(
                req.query
            )
        }).send(res);
    }

    listAllNoti = async (req, res, next) => {
        const id = req.params.id;
        new SuccessResponse({
            message: 'Update status noti success',
            metadata: await NotificationService.listAllNoti(
                id
            )
        }).send(res);
    }

    listNotiNotRead = async (req, res, next) => {
        const id = req.params.id;
        new SuccessResponse({
            message: 'List noti not read success',
            metadata: await NotificationService.listNotiNotRead(
                { id }
            )
        }).send(res);
    }

    updateStatusNoti = async (req, res, next) => {
        const id = req.params.id;
        new SuccessResponse({
            message: 'Update status noti success',
            metadata: await NotificationService.updateStatusNoti(
                id
            )
        }).send(res);
    }
}

module.exports = new NotificationController()