'use strict'
const { Types } = require('mongoose');
const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const { AuthFailureError, NotFoundError } = require('../core/error.response')
const { findByUserId } = require('../services/keyToken.service');
const KeyTokenService = require('../services/keyToken.service');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESHTOKEN: 'x-rtoken-id',
    FORWARED_FOR: 'x-forwarded-for',
}


const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        const accessToken = await JWT.sign(payload, publicKey, {
            expiresIn: '15m'
        })

        const refreshToken = await JWT.sign(payload, privateKey, {
            expiresIn: '3 days'
        })

        JWT.verify(accessToken, publicKey, (err, decode) => {
            if (err) {
                console.error(`error verify:::`, err)
            } else {
                console.log(`decode verify:::`, decode)

            }
        })

        return { accessToken, refreshToken }
    } catch (err) {

    }
}

const authenticationV2 = asyncHandler(async (req, res, next) => {
    const userId = req.headers[HEADER.CLIENT_ID];
    if (!userId) throw new AuthFailureError("Not exist this account")

    const keyStore = await KeyTokenService.findByUserId(userId)
    if (!keyStore || !keyStore.isActive) throw new NotFoundError('Not found keyStore')

    if (req.headers[HEADER.REFRESHTOKEN]) {
        try {
            const refreshToken = req.headers[HEADER.REFRESHTOKEN]
            const decodeUser = JWT.verify(refreshToken, keyStore.privateKey)
            if (userId !== decodeUser.userId) throw new AuthFailureError('Invalid userId')
            req.keyStore = keyStore
            req.user = decodeUser
            req.refreshToken = refreshToken
            req.ipAddr = req.headers[HEADER.FORWARED_FOR] 

            return next();
        } catch (error) {
            throw error
        }
    }

    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if (!accessToken) throw new AuthFailureError('Invalid Request!')

   
    try {

        const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
        if (userId !== decodeUser.userId) throw new AuthFailureError('Invalid userId')
        req.keyStore = keyStore
        req.user = decodeUser
        req.ipAddr = req.headers[HEADER.FORWARED_FOR] 
        return next();
    } catch (error) {
        throw error
    }


})

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret)
}

const extractUserIdFromToken = async (req) => {

    const userId = req.headers[HEADER.CLIENT_ID];
    if (!userId) throw new AuthFailureError("Not exist this account")

    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if (!accessToken) throw new AuthFailureError('Invalid Request!')

   
    try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
        if (userId !== decodeUser.userId) throw new AuthFailureError('Invalid userId')

        return decodeUser.userId;
    } catch (error) {
        throw error
    }


}

const checkAdmin = async (req, res, next) => {
    const user = await User.findById(req.user.userId);
    if (user && user.usr_role === 'admin') {
        next();
    } else {
        throw new ForbiddenError('Access denied. Admin role required.');
    }
}

module.exports = {
    createTokenPair,
    authenticationV2,
    verifyJWT,
    extractUserIdFromToken,
    checkAdmin
}

