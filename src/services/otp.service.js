

'use strict'

const {randomInt} = require('crypto');
const OTP = require('../models/otp.model');
const { NotFoundError } = require('../core/error.response');



const generatorTokenRandom = () => {
    const token = randomInt(0 , Math.pow(2,32))
    return token;
}

const newOtp = async ({
    email
}) => {
    const token = generatorTokenRandom();
    const newToken = await OTP.create({
        otp_token: token,
        otp_email: email
    })
    return newToken;
}

const checkEmailToken = async ({token}) => {
    const hasToken = await OTP.findOne({
        otp_token: token
    })
    //const email = hasToken.otp_email;

    if(!hasToken) {
        throw new NotFoundError("Token expire!")
    }

    OTP.deleteOne({otp_token: token}).then()

    return {
        email: hasToken.otp_email,
        tokenResult:token
    };
}

module.exports = {
    newOtp,
    checkEmailToken
}