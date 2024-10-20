// src/validators/userValidator.js
const { body } = require('express-validator');

const createUserValidator = [
    body('usr_id')
        .exists().withMessage('usr_id không được để trống')
        .isInt({ gt: 0 }).withMessage('usr_id phải là số nguyên dương'),
    
    body('usr_slug')
        .exists().withMessage('usr_slug không được để trống')
        .isString().withMessage('usr_slug phải là chuỗi'),
    
    body('usr_name')
        .optional()
        .isString().withMessage('usr_name phải là chuỗi'),
    
    body('usr_password')
        .optional()
        .isString().withMessage('usr_password phải là chuỗi')
        .isLength({ min: 6 }).withMessage('usr_password phải ít nhất 6 ký tự'),
    
    body('usr_salt')
        .optional()
        .isString().withMessage('usr_salt phải là chuỗi'),
    
    body('usr_email')
        .exists().withMessage('usr_email không được để trống')
        .isEmail().withMessage('usr_email phải là email hợp lệ'),
    
    body('usr_phone')
        .optional()
        .isString().withMessage('usr_phone phải là chuỗi'),
    
    body('usr_sex')
        .optional()
        .isIn(['male', 'female', 'other']).withMessage('usr_sex phải là male, female hoặc other'),
    
    body('usr_avatar')
        .optional()
        .isURL().withMessage('usr_avatar phải là URL hợp lệ'),
    
    body('usr_date_of_birth')
        .optional()
        .isISO8601().toDate().withMessage('usr_date_of_birth phải là ngày hợp lệ'),
    
    body('usr_role')
        .optional()
        .isMongoId().withMessage('usr_role phải là Mongo ID hợp lệ'),
    
    body('usr_status')
        .optional()
        .isIn(['pending', 'active', 'block']).withMessage('usr_status phải là pending, active hoặc block')
];

const updateUserValidator = [
    body('usr_id')
        .optional()
        .isInt({ gt: 0 }).withMessage('usr_id phải là số nguyên dương'),
    
    body('usr_slug')
        .optional()
        .isString().withMessage('usr_slug phải là chuỗi'),
    
    body('usr_name')
        .optional()
        .isString().withMessage('usr_name phải là chuỗi'),
    
    body('usr_password')
        .optional()
        .isString().withMessage('usr_password phải là chuỗi')
        .isLength({ min: 6 }).withMessage('usr_password phải ít nhất 6 ký tự'),
    
    body('usr_salt')
        .optional()
        .isString().withMessage('usr_salt phải là chuỗi'),
    
    body('usr_email')
        .optional()
        .isEmail().withMessage('usr_email phải là email hợp lệ'),
    
    body('usr_phone')
        .optional()
        .isString().withMessage('usr_phone phải là chuỗi'),
    
    body('usr_sex')
        .optional()
        .isIn(['male', 'female', 'other']).withMessage('usr_sex phải là male, female hoặc other'),
    
    body('usr_avatar')
        .optional()
        .isURL().withMessage('usr_avatar phải là URL hợp lệ'),
    
    body('usr_date_of_birth')
        .optional()
        .isISO8601().toDate().withMessage('usr_date_of_birth phải là ngày hợp lệ'),
    
    body('usr_role')
        .optional()
        .isMongoId().withMessage('usr_role phải là Mongo ID hợp lệ'),
    
    body('usr_status')
        .optional()
        .isIn(['pending', 'active', 'block']).withMessage('usr_status phải là pending, active hoặc block')
];

module.exports = {
    createUserValidator,
    updateUserValidator
};
