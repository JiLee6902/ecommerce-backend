'use strict'

const { SuccessResponse } = require("../core/success.response")
const { 
    createStaff,
    updateInformation,
    changePassword,
    forgotPassword,
    resetPassword,
    banStaff,
    unbanStaff,
    getStaffStats,
    transferStaff,
    updateStaffStatus
} = require("../services/staff.service")

class StaffController {
    createStaff = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff created successfully',
            metadata: await createStaff({
                data: req.body
            })
        }).send(res)
    }

    updateProfile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Profile updated successfully',
            metadata: await updateInformation({
                staffId: req.user.userId,
                updateData: req.body
            })
        }).send(res)
    }

    changePassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Password changed successfully',
            metadata: await changePassword({
                staffId: req.user.userId,
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword
            })
        }).send(res)
    }

    forgotPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Password reset email sent',
            metadata: await forgotPassword({
                email: req.body.email
            })
        }).send(res)
    }

    resetPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Password reset successfully',
            metadata: await resetPassword({
                token: req.body.token,
                newPassword: req.body.newPassword
            })
        }).send(res)
    }

    banStaff = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff banned successfully',
            metadata: await banStaff({
                shopId: req.user.userId,
                staffId: req.params.staffId
            })
        }).send(res)
    }

    unbanStaff = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff unbanned successfully',
            metadata: await unbanStaff({
                shopId: req.user.userId,
                staffId: req.params.staffId
            })
        }).send(res)
    }

    getStaffStats = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff statistics retrieved',
            metadata: await getStaffStats(req.user.userId)
        }).send(res)
    }

    transferStaff = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff transferred successfully',
            metadata: await transferStaff(
                req.params.staffId,
                req.body.newShopId
            )
        }).send(res)
    }

    updateStaffStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Staff status updated successfully',
            metadata: await updateStaffStatus(
                req.params.staffId,
                req.body.status
            )
        }).send(res)
    }
}

module.exports = new StaffController()