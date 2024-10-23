'use strict'

const { createTokenPair } = require("../auth/authUtils");
const { BadRequestError, ForbiddenError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const { createStaff } = require("../models/repositories/staff.repo");
const STAFF = require("../models/staff.model");
const SHOP = require("../models/shop.model");
const { convertToObjectIdMongoDb, getInfoData } = require("../utils");
const { sendEmailToken, sendEmailPassword } = require("./email.service");
const KeyTokenService = require("./keyToken.service");
const { checkEmailToken } = require("./otp.service");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmailForgotPassword } = require("./email.service");

const createStaff = async ({ data }) => {
    const existStaff = await STAFF.findOne({ staff_email: data.staff_email }).lean();
    if (existStaff) {
        throw new BadRequestError('Account already exists');
    }

    const staff = STAFF.create({
        staff_name: data.staff_name,
        staff_password: data.staff_password,
        staff_email: data.staff_email,
        staff_phone: data.staff_phone,
        staff_sex: data.staff_sex,
        staff_date_of_birth: data.staff_date_of_birth,
        staff_role: data.staff_role,
        staff_status: 'pending',
        staff_shop: convertToObjectIdMongoDb(data.staff_shop)
    })
    return staff;
}

const updateInformation = async ({ staffId, updateData }) => {
    const { staff_email, ...otherData } = updateData;
    if (staff_email) {
        throw new BadRequestError('Email cannot be changed');
    }

    const updatedStaff = await STAFF.findByIdAndUpdate(staffId, otherData, { new: true });
    if (!updatedStaff) {
        throw new BadRequestError('Staff not found');
    }

    return updatedStaff;
};

const changePassword = async ({ staffId, currentPassword, newPassword }) => {
    const staff = await STAFF.findById(staffId);
    if (!staff) {
        throw new BadRequestError('Staff not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, staff.staff_password);
    if (!isMatch) {
        throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    staff.staff_password = hashedPassword;
    await staff.save();

    return { message: 'Password changed successfully' };
};

const forgotPassword = async ({ email }) => {
    const staff = await STAFF.findOne({ staff_email: email });
    if (!staff) {
        throw new BadRequestError('Staff not found');
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (staff.staff_last_password_reset_request < oneDayAgo) {
        staff.staff_password_reset_count = 0;
    }

    if (staff.staff_password_reset_count >= 5 && staff.staff_last_password_reset_request > oneDayAgo) {
        throw new BadRequestError('Too many password reset requests. Please try again later.');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    staff.staff_reset_password_token = resetToken;
    staff.staff_reset_password_expires = Date.now() + 1800000;

    staff.staff_password_reset_count += 1;
    staff.staff_last_password_reset_request = now;

    await staff.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await sendEmailForgotPassword({
        email,
        resetLink
    });

    return { message: 'Password reset email sent' };
};

const resetPassword = async ({ token, newPassword }) => {
    const staff = await STAFF.findOne({
        staff_reset_password_token: token,
        staff_reset_password_expires: { $gt: Date.now() }
    });

    if (!staff) {
        throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    staff.staff_password = hashedPassword;
    staff.staff_reset_password_token = undefined;
    staff.staff_reset_password_expires = undefined;
    staff.staff_password_reset_count = 0;
    staff.staff_last_password_reset_request = undefined;

    await staff.save();

    return { message: 'Password reset successfully' };
};

const banStaff = async ({ shopId, staffId }) => {
    const shop = await SHOP.findById(shopId);
    if (!shop) {
        throw new ForbiddenError('You do not have permission to ban staff');
    }

    const staff = await STAFF.findById(staffId);
    if (!staff) {
        throw new BadRequestError('Staff not found');
    }

    if (staff.staff_shop !== shopId) {
        throw new ForbiddenError('You do not have permission to ban staff');
    }

    staff.staff_status = 'terminated';
    await staff.save();

    return { message: 'Staff banned successfully' };
};

const unbanStaff = async ({ shopId, staffId }) => {
    const shop = await SHOP.findById(shopId);
    if (!shop) {
        throw new ForbiddenError('You do not have permission to ban staff');
    }

    const staff = await STAFF.findById(staffId);
    if (!staff) {
        throw new BadRequestError('Staff not found');
    }

    if (staff.staff_shop !== shopId) {
        throw new ForbiddenError('You do not have permission to ban staff');
    }

    staff.staff_status = 'active';
    await staff.save();

    return { message: 'Staff unbanned successfully' };
};

const getStaffStats = async(shopId) => {
    const staffStats = await STAFF.aggregate([
        { $match: { staff_shop: convertToObjectIdMongoDb(shopId) } },
        {
            $group: {
                _id: '$staff_status',
                count: { $sum: 1 }
            }
        }
    ]);

    return staffStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
    }, {});
}

const transferStaff = async(staffId, newShopId) => {
    const staff = await STAFF.findById(staffId);
    if (!staff) {
        throw new BadRequestError('Staff not found');
    }

    const newShop = await SHOP.findById(newShopId);
    if (!newShop) {
        throw new BadRequestError('New shop not found');
    }

    if (newShop.status !== 'active') {
        throw new BadRequestError('Cannot transfer staff to inactive shop');
    }

    staff.staff_shop = newShopId;
    staff.staff_status = 'pending';
    await staff.save();

    return {
        message: 'Staff transferred successfully',
        staff
    };
}

const updateStaffStatus = async(staffId, status) => {
    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(status)) {
        throw new BadRequestError('Invalid status');
    }

    const staff = await STAFF.findByIdAndUpdate(
        staffId,
        { status },
        { new: true }
    );

    if (!staff) {
        throw new BadRequestError('Satff not found');
    }


    return staff;
}


module.exports = {
    updateInformation,
    changePassword,
    forgotPassword,
    resetPassword,
    banStaff,
    unbanStaff,
    getStaffStats,
    transferStaff,
    updateStaffStatus
};
