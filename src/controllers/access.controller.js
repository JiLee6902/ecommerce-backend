'use strict'

const AccessService = require('../services/access.service')


const { SuccessResponse, CREATED } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class AccessController {

    handlerRefreshToken = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get token success',
            metadata: await AccessService.handlerRefreshToken({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore
            })
        }).send(res);
    }

    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout success',
            metadata: await AccessService.logout(req.keyStore)
        }).send(res);
    }

    login = async (req, res, next) => {
        const { email } = req.body
        if (!email) {
            throw new BadRequestError('email missing!!!')
        }
        const sendData = Object.assign(
            { requestId: req.requestId },
            req.body
        )
        new SuccessResponse({
            metadata: await AccessService.login(sendData)
        }).send(res);
    }


    signUpUser = async (req, res, next) => {

        new CREATED({
            message: 'Registered Account OK!',
            metadata: await AccessService.signUpUser(req.body),
            options: {
                limit: 10
            }
        }).send(res);

    }

    signUpShop = async (req, res, next) => {

        new CREATED({
            message: 'Registered Shop OK!',
            metadata: await AccessService.signUpShop(req.body),
            options: {
                limit: 10
            }
        }).send(res);

    }
}

module.exports = new AccessController();

