'use strict'

const TEMPLATE = require("../models/template.model");
const { 
    temLogin,
    temPassword,
    temForgotPassword,
    temOrderConfirmation,
    temNotificationEmail   
} = require("../utils/tem.html");

const newTemplate = async ({
    tem_name,
    tem_id = 0,
    tem_html
}) => {
    const newTem = await TEMPLATE.create({
        tem_id,
        tem_name,
        tem_html: temPassword()

    })

    return newTem;
}

const getTemplate = async ({
    tem_name
}) => {
    const template = await TEMPLATE.findOne({tem_name})
    return template;
}

module.exports = {
    newTemplate, 
    getTemplate
}

