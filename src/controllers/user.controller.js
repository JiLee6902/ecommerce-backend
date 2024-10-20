
'use strict'

const { SuccessResponse } = require("../core/success.response")
const { newUserService, checkLoginEmailTokenService, updateInformation,
    changePassword, forgotPassword, resetPassword, banUser, unbanUser
} = require("../services/user.service")

class UserController {
    
    //new user
    newUser = async (req, res, next) => {
        const response = await newUserService({
            email: req.body.email
        })
        new SuccessResponse(response).send(res)
    }

    //check user token via email
    checkLoginEmailToken = async (req, res, next) => {

        const {token = null} = req.query;
        const response = await checkLoginEmailTokenService({
            token
        })
        new SuccessResponse(response).send(res)
    }

    updateProfile = async (req, res, next) => {
        new SuccessResponse({
            message: 'update profile',
            metadata: await updateInformation(req.body)
        }).send(res);
    }

    changePassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'change password',
            metadata: await changePassword(req.body)
        }).send(res);
    }

    forgotPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'change password',
            metadata: await forgotPassword(req.body)
        }).send(res);
    }

    resetPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'change password',
            metadata: await resetPassword(req.body)
        }).send(res);
    }

    banUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'change password',
            metadata: await banUser(req.body)
        }).send(res);
    }

    unbanUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'change password',
            metadata: await unbanUser(req.body)
        }).send(res);
    }
}

module.exports = new UserController()