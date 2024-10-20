'use strict'

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'jilee',
    api_key: '693153214241727',
    api_secret: 'iu97s7tbUeWrGIVpcDFjE40jID8'
});

module.exports = cloudinary