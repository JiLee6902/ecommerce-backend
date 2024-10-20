
'use strict'

const { SuccessResponse } = require("../core/success.response");
const elasticsearchService = require("../services/elasticsearch.service");
const { updateInformation,
    changePassword, forgotPassword, resetPassword } = require("../services/shop.service")

class ShopController {
    updateProfile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update profile',
            metadata: await updateInformation(req.body)
        }).send(res);
    }

    changePassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Change password',
            metadata: await changePassword(req.body)
        }).send(res);
    }

    forgotPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Forgot password',
            metadata: await forgotPassword(req.body)
        }).send(res);
    }

    resetPassword = async (req, res, next) => {
        new SuccessResponse({
            message: 'Reset password',
            metadata: await resetPassword(req.body)
        }).send(res);
    }

    searchShop = async (req, res, next) => {
        const { keyword, status, verify, page = 1, limit = 20 } = req.query;
        new SuccessResponse({
            message: 'Search Shops success',
            metadata: await elasticsearchService.searchShops(
                keyword, 
                { status, verify }, 
                (page - 1) * limit, 
                limit
              ) 
        }).send(res);
    }
}

module.exports = new ShopController()