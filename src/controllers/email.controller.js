

'use strict'

const { BadRequestError } = require('../core/error.response');
const { SuccessResponse } = require('../core/success.response');
const { newTemplate } = require('../services/template.service');
const { uploadImageFromUrl, uploadImageFromLocal, uploadImageFromLocalFiles, uploadImageFromLocalS3 } = require('../services/upload.service');

class EmailController {

    newTemplate = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create template success',
            metadata: await newTemplate(req.body)
        }).send(res);
    }

    
}

module.exports = new EmailController()