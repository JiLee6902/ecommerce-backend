'use strict'

const { convertToObjectIdMongoDb } = require('../../utils')
const {cart} = require('../cart.model')

const findCartById = async(cartId) => {
    return await cart.findOne({_id: convertToObjectIdMongoDb(cartId), cart_state:'active'}).lean()
}

module.exports = {
    findCartById
}