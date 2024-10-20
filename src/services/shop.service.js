'use-strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Shop = require('../models/shop.model');
const { BadRequestError, AuthFailureError } = require('../core/error.response');
const { sendEmailForgotPassword } = require("./email.service");

class ShopService {
    static async updateInformation(shopId, updateData) {
        const { email, ...otherData } = updateData;
        if (email) {
            throw new BadRequestError('Email cannot be changed');
        }

        const updatedShop = await Shop.findByIdAndUpdate(shopId, otherData, { new: true });
        if (!updatedShop) {
            throw new BadRequestError('Shop not found');
        }

        return updatedShop;
    }

    static async changePassword({shopId, currentPassword, newPassword}) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, shop.password);
        if (!isMatch) {
            throw new AuthFailureError('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        shop.password = hashedPassword;
        await shop.save();

        return { message: 'Password changed successfully' };
    }

    static async forgotPassword({email}) {
        const shop = await Shop.findOne({ email });
        if (!shop) {
            throw new BadRequestError('Shop not found');
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        shop.resetPasswordToken = resetToken;
        shop.resetPasswordExpires = Date.now() + 3600000;
        await shop.save();

        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`
        await sendEmailForgotPassword({
            email,
            resetLink
        })

        return { message: 'Password reset email sent' };
    }

    static async resetPassword({ token, newPassword}) {
        const shop = await Shop.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!shop) {
            throw new BadRequestError('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        shop.password = hashedPassword;
        shop.resetPasswordToken = undefined;
        shop.resetPasswordExpires = undefined;
        await shop.save();

        return { message: 'Password reset successfully' };
    }
}

module.exports = ShopService;