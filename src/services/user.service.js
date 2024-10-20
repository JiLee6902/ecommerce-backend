

'use strict'

const { createTokenPair } = require("../auth/authUtils");
const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const { createUser } = require("../models/repositories/user.repo");
const USER = require("../models/user.model");
const { convertToObjectIdMongoDb, getInfoData } = require("../utils");
const { sendEmailToken, sendEmailPassword } = require("./email.service");
const KeyTokenService = require("./keyToken.service");
const { checkEmailToken } = require("./otp.service");
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendEmailForgotPassword } = require("./email.service");



const newUserService = async ({
    email = null,
    captcha = null
}) => {

    const user = await USER.findOne({ email }).lean();

    if (user) {
        throw new BadRequestError('email already exist!')
    }

    const result = await sendEmailToken({
        email
    })

    return {
        message: 'verify email server',
        metadata: {
            token: result
        }
    }
}

const checkLoginEmailTokenService = async ({
    token
}) => {
    try {
        const { email, tokenResult } = await checkEmailToken({ token })
        console.log("EMAIL::", email)
        if (!email) {
            throw new BadRequestError('Should enter your email again, please!')
        }

        const hasUser = await findUserByEmailWithLogin({ email })
        if (hasUser) throw new BadRequestError('email already exist!')


        const passwordHash = await bcrypt.hash(email, 10)
        const newUser = await createUser({
            usr_id: 1,
            usr_slug: 'xyz',
            usr_name: email,
            usr_password: passwordHash,
            usr_email: email,
            usr_role: '669e1bd06185fbc252187163'
        })


        if (newUser) {
            const privateKey = crypto.randomBytes(64).toString('hex')
            const publicKey = crypto.randomBytes(64).toString('hex')

            const keyStore = await KeyTokenService.createKeyToken({
                userId: newUser.usr_id,
                publicKey,
                privateKey
            })


            if (!keyStore) {
                return {

                    message: 'keyStore error',
                    metadata: ''
                }
            }


            const tokens = await createTokenPair(
                { userId: newUser._id, email }, publicKey, privateKey
            )

            await sendEmailPassword({ email })

            return {
                message: 'verify successfully',
                metadata: {
                    user: getInfoData({ fields: ['usr_id', 'usr_name', 'usr_email'], object: newUser }),
                    tokens
                }
            }

        }

    } catch (error) {
        return {
            message: error.message || 'An error occurred',
            metadata: {}
        }
    }
}

const findUserByEmailWithLogin = async ({
    email
}) => {
    const user = await USER.findOne({ usr_email: email }).lean()
    return user
}

const updateInformation = async ({ userId, updateData }) => {
    const { usr_email, ...otherData } = updateData;
    if (usr_email) {
        throw new BadRequestError('Email cannot be changed');
    }

    const updatedUser = await User.findByIdAndUpdate(userId, otherData, { new: true });
    if (!updatedUser) {
        throw new BadRequestError('User not found');
    }

    return updatedUser;
}

const changePassword = async ({ userId, currentPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new BadRequestError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.usr_password);
    if (!isMatch) {
        throw new AuthFailureError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.usr_password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
}

const forgotPassword = async ({ email }) => {
    const user = await User.findOne({ usr_email: email });
    if (!user) {
        throw new BadRequestError('User not found');
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (user.usr_last_password_reset_request < oneDayAgo) {
        user.usr_password_reset_count = 0;
    }

    if (user.usr_password_reset_count >= 5 && user.usr_last_password_reset_request > oneDayAgo) {
        throw new BadRequestError('Too many password reset requests. Please try again later.');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.usr_reset_password_token = resetToken;
    user.usr_reset_password_expires = Date.now() + 1800000; 

    user.usr_password_reset_count += 1;
    user.usr_last_password_reset_request = now;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`
    
    await sendEmailForgotPassword({
        email,
        resetLink
    })

    return { message: 'Password reset email sent' };
}

const resetPassword = async ({ token, newPassword }) => {
    const user = await User.findOne({
        usr_reset_password_token: token,
        usr_reset_password_expires: { $gt: Date.now() }
    });

    if (!user) {
        throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.usr_password = hashedPassword;
    user.usr_reset_password_token = undefined;
    user.usr_reset_password_expires = undefined;
    user.usr_password_reset_count = 0;
    user.usr_last_password_reset_request = undefined;

    await user.save();

    return { message: 'Password reset successfully' };
}

const banUser = async ({ adminId, userId }) => {
    const admin = await User.findById(adminId).populate('usr_role');
    if (!admin || admin.usr_role.rol_name !== 'admin') {
        throw new ForbiddenError('You do not have permission to ban users');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new BadRequestError('User not found');
    }

    user.usr_status = 'banned';
    await user.save();

    return { message: 'User banned successfully' };
}

const unbanUser = async ({ adminId, userId }) => {
    const admin = await User.findById(adminId).populate('usr_role');
    if (!admin || admin.usr_role.rol_name !== 'admin') {
        throw new ForbiddenError('You do not have permission to unban users');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new BadRequestError('User not found');
    }

    user.usr_status = 'active';
    await user.save();

    return { message: 'User unbanned successfully' };
}

module.exports = {
    newUserService,
    checkLoginEmailTokenService,
    updateInformation,
    changePassword, forgotPassword, resetPassword,
    banUser,
    unbanUser
}