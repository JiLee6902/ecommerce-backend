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

    loginWithGoogle = async (req, res, next) => {
        const { idToken } = req.body;
        if (!idToken) {
            throw new BadRequestError('Google ID token is required');
        }

        const result = await AccessService.loginWithGoogle({ idToken });

        if (result.status === 'VERIFICATION_NEEDED') {
            return new SuccessResponse({
                message: result.message,
                metadata: { status: result.status }
            }).send(res);
        }

        new SuccessResponse({
            message: 'Login with Google successful',
            metadata: result
        }).send(res);

    }

    loginWithFacebook = async (req, res, next) => {
        const { accessToken } = req.body;
        if (!accessToken) {
            throw new BadRequestError('Facebook access token is required');
        }

        const result = await AccessService.loginWithFacebook({ accessToken });
        
        if (result.status === 'VERIFICATION_NEEDED') {
            return new SuccessResponse({
                message: result.message,
                metadata: { status: result.status }
            }).send(res);
        }

        new SuccessResponse({
            message: 'Login with Facebook successful',
            metadata: result
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

    verifySocialAccount = async (req, res, next) => {
        const { verificationToken } = req.params;
        if (!verificationToken) {
            throw new BadRequestError('Verification token is required');
        }

        const result = await AccessService.verifyAndCreateSocialAccount({ verificationToken });
        
        new SuccessResponse({
            message: 'Social account verified and created successfully',
            metadata: result
        }).send(res);
    }

}

module.exports = new AccessController();

