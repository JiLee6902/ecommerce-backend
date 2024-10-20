'use strict'

const apikeyModel = require("../models/apikey.model")
const crypto = require('crypto')
const findById = async(key) => {
    const objectKey = await apikeyModel.findOne({key, status: true }).lean()
    return objectKey;
}



module.exports = {
    findById
}