

'use strict'

const { BadRequestError } = require('../core/error.response');
const { SuccessResponse } = require('../core/success.response');
const { uploadImageFromUrl, uploadImageFromLocal, uploadImageFromLocalFiles, uploadImageFromLocalS3 } = require('../services/upload.service');

class CheckoutController {

    uploadFile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadImageFromUrl()
        }).send(res);
    }

    uploadFileThumb = async (req, res, next) => {
        const { file } = req

        if (!file) {
            throw new BadRequestError('File missing!')
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadImageFromLocal({
                file
            })
        }).send(res);
    }

    uploadImageFromLocalFiles = async (req, res, next) => {
        const { files } = req
        if (!files) {
            throw new BadRequestError('File missing!')
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadImageFromLocalFiles({
                files
            })
        }).send(res);
    }

    uploadImageFromLocalS3 = async (req, res, next) => {
        const { file, body: { folderName } } = req
        if (!file) {
            throw new BadRequestError('File missing!')
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadImageFromLocalS3({
                file,
                folderName: folderName || 'default-folder'
            })
        }).send(res);
    }
}

module.exports = new CheckoutController()