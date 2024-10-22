'use strict'

const cloudinary = require("../configs/cloudinary.config");
//const { getSignedUrl } = require("@aws-sdk/s3-request-presigner") //của S3
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer") //của cloudfront
const { s3, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("../configs/s3.config");
const crypto = require('crypto')
const randomImageName = () => crypto.randomBytes(16).toString('hex')
const urlImagePublic = `https://d1w35hv77zm0f2.cloudfront.net`


const uploadImageFromLocalS3 = async ({
    file
}) => {
    try {

        const imageName = randomImageName();
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName, 
            Body: file.buffer,
            ContentType: 'image/jpeg'
        })

        const result = await s3.send(command) // for only s3
        const url = getSignedUrl({
            url: `${urlImagePublic}/${imageName}`,
            keyPairId: 'K2CCMLQ1DS69HN',
            dateLessThan: new Date(Date.now() + 1000 * 120),
            privateKey: process.env.AWS_BUCKET_PRIVATE_KEY_ID
        });

        return {
            url,
        };


    } catch (error) {
        console.error(error)
    }
}

// END S3 (AWS) Service /////////

// START UPLOAD WITH CLOUDINARY
const uploadImageFromUrl = async () => {
    try {
        const urlImage = 'https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-lgurcl7xiwab80';

        const folderName = 'product/shopId', newFileName = 'testdemo'

        const result = await cloudinary.uploader.upload(urlImage, {
            folder: folderName,
            public_id: newFileName,
        })

        return result;

    } catch (error) {
        console.error(error)
    }
}

const uploadImageFromLocal = async ({
    file,
    folderName = 'product/8409'
}) => {
    try {

        const result = await cloudinary.uploader.upload(file.path, {
            folder: folderName,
            public_id: 'thumb',
        })

        return {
            image_url: result.secure_url,
            shopId: 8409,
            thumb_url: await cloudinary.url(result.public_id, {
                height: 100,
                width: 100,
                format: 'jpg'
            })
        };

    } catch (error) {
        console.error(error)
    }
}

const uploadImageFromLocalFiles = async ({
    files,
    folderName = 'product/8409'
}) => {
    try {

        if (!files.length) return;
        const uploadedUrls = [];
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: folderName,
            })

            uploadedUrls.push({
                image_url: result.secure_url,
                shopId: 8409,
                thumb_url: await cloudinary.url(result.public_id, {
                    height: 100,
                    width: 100,
                    format: 'jpg'
                })
            })
        }


        return uploadedUrls;

    } catch (error) {
        console.error(error)
    }
}
// END UPLOAD WITH CLOUDINARY

module.exports = {
    uploadImageFromUrl,
    uploadImageFromLocalFiles,
    uploadImageFromLocal,
    uploadImageFromLocalS3
}