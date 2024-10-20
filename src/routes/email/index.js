'use strict'

const express= require('express');

const  asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const uploadController = require('../../controllers/upload.controller');
const { uploadDisk, uploadMemory } = require('../../configs/multer.config');
const emailController = require('../../controllers/email.controller');

const router = express.Router();

router.post('/new_template',asyncHandler(emailController.newTemplate))


module.exports = router;