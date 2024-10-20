
const { param, query } = require('express-validator');

const idValidator = [
    param('id')
        .exists().withMessage('ID không được để trống')
        .isInt({ gt: 0 }).withMessage('ID phải là số nguyên dương')
];


const skuValidator = [
    query('sku_id')
        .exists().withMessage('sku_id không được để trống')
        .isInt({ gt: 0 }).withMessage('sku_id phải là số nguyên dương'),
    
    query('product_id')
        .exists().withMessage('product_id không được để trống')
        .isInt({ gt: 0 }).withMessage('product_id phải là số nguyên dương')
];


module.exports = {
    idValidator,
    skuValidator
};

