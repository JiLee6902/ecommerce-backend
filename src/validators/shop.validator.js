// src/validators/shopValidator.js
const { body } = require('express-validator');

const createShopValidator = [
    body('name')
        .exists().withMessage('name không được để trống')
        .isString().withMessage('name phải là chuỗi')
        .trim()
        .isLength({ max: 150 }).withMessage('name không được vượt quá 150 ký tự'),
    
    body('email')
        .exists().withMessage('email không được để trống')
        .isEmail().withMessage('email phải là email hợp lệ')
        .trim()
        .normalizeEmail(),
    
    body('password')
        .exists().withMessage('password không được để trống')
        .isString().withMessage('password phải là chuỗi')
        .isLength({ min: 6 }).withMessage('password phải ít nhất 6 ký tự'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('status phải là active hoặc inactive'),
    
    body('verify')
        .optional()
        .isBoolean().withMessage('verify phải là boolean'),
    
    body('roles')
        .optional()
        .isArray().withMessage('roles phải là mảng'),
    
    body('roles.*')
        .optional()
        .isMongoId().withMessage('Mỗi role trong roles phải là Mongo ID hợp lệ')
];

const updateShopValidator = [
    body('name')
        .optional()
        .isString().withMessage('name phải là chuỗi')
        .trim()
        .isLength({ max: 150 }).withMessage('name không được vượt quá 150 ký tự'),
    
    body('email')
        .optional()
        .isEmail().withMessage('email phải là email hợp lệ')
        .trim()
        .normalizeEmail(),
    
    body('password')
        .optional()
        .isString().withMessage('password phải là chuỗi')
        .isLength({ min: 6 }).withMessage('password phải ít nhất 6 ký tự'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('status phải là active hoặc inactive'),
    
    body('verify')
        .optional()
        .isBoolean().withMessage('verify phải là boolean'),
    
    body('roles')
        .optional()
        .isArray().withMessage('roles phải là mảng'),
    
    body('roles.*')
        .optional()
        .isMongoId().withMessage('Mỗi role trong roles phải là Mongo ID hợp lệ')
];

module.exports = {
    createShopValidator,
    updateShopValidator
};
