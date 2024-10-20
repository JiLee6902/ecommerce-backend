// src/validators/productValidator.js
const { body } = require('express-validator');

const createProductValidator = [
    body('product_name')
        .exists().withMessage('product_name không được để trống')
        .isString().withMessage('product_name phải là chuỗi')
        .trim(),
    
    body('product_thumb')
        .exists().withMessage('product_thumb không được để trống')
        .isURL().withMessage('product_thumb phải là URL hợp lệ')
        .trim(),
    
    body('product_description')
        .exists().withMessage('product_description không được để trống')
        .isString().withMessage('product_description phải là chuỗi'),
    
    body('product_price')
        .exists().withMessage('product_price không được để trống')
        .isFloat({ gt: 0 }).withMessage('product_price phải là số thực dương'),
    
    body('product_quantity')
        .exists().withMessage('product_quantity không được để trống')
        .isInt({ gt: -1 }).withMessage('product_quantity phải là số nguyên không âm'),
    
    body('product_type')
        .exists().withMessage('product_type không được để trống')
        .isIn(['Electronics', 'Clothing', 'Furniture']).withMessage('product_type phải là Electronics, Clothing hoặc Furniture'),
    
    body('product_shop')
        .exists().withMessage('product_shop không được để trống')
        .isMongoId().withMessage('product_shop phải là Mongo ID hợp lệ'),
    
    body('product_attributes')
        .exists().withMessage('product_attributes không được để trống')
        .custom((value, { req }) => {
            const type = req.body.product_type;
            if (type === 'Clothing') {
                if (!value.brand || !value.size || !value.material) {
                    throw new Error('product_attributes phải chứa brand, size và material cho loại Clothing');
                }
            } else if (type === 'Electronics') {
                if (!value.manufacturer || !value.model || !value.color) {
                    throw new Error('product_attributes phải chứa manufacturer, model và color cho loại Electronics');
                }
            } else if (type === 'Furniture') {
                if (!value.brand || !value.size || !value.material) {
                    throw new Error('product_attributes phải chứa brand, size và material cho loại Furniture');
                }
            }
            return true;
        }),
    
    body('product_ratingsAverage')
        .optional()
        .isFloat({ min: 1, max: 5 }).withMessage('product_ratingsAverage phải là số thực từ 1 đến 5'),
    
    body('product_variation')
        .optional()
        .isArray().withMessage('product_variation phải là mảng'),
    
    body('isDraft')
        .optional()
        .isBoolean().withMessage('isDraft phải là boolean'),
    
    body('isPublished')
        .optional()
        .isBoolean().withMessage('isPublished phải là boolean')
];

const updateProductValidator = [
    body('product_name')
        .optional()
        .isString().withMessage('product_name phải là chuỗi')
        .trim(),
    
    body('product_thumb')
        .optional()
        .isURL().withMessage('product_thumb phải là URL hợp lệ')
        .trim(),
    
    body('product_description')
        .optional()
        .isString().withMessage('product_description phải là chuỗi'),
    
    body('product_price')
        .optional()
        .isFloat({ gt: 0 }).withMessage('product_price phải là số thực dương'),
    
    body('product_quantity')
        .optional()
        .isInt({ gt: -1 }).withMessage('product_quantity phải là số nguyên không âm'),
    
    body('product_type')
        .optional()
        .isIn(['Electronics', 'Clothing', 'Furniture']).withMessage('product_type phải là Electronics, Clothing hoặc Furniture'),
    
    body('product_shop')
        .optional()
        .isMongoId().withMessage('product_shop phải là Mongo ID hợp lệ'),
    
    body('product_attributes')
        .optional()
        .custom((value, { req }) => {
            const type = req.body.product_type;
            if (type) { 
                if (type === 'Clothing') {
                    if (!value.brand || !value.size || !value.material) {
                        throw new Error('product_attributes phải chứa brand, size và material cho loại Clothing');
                    }
                } else if (type === 'Electronics') {
                    if (!value.manufacturer || !value.model || !value.color) {
                        throw new Error('product_attributes phải chứa manufacturer, model và color cho loại Electronics');
                    }
                } else if (type === 'Furniture') {
                    if (!value.brand || !value.size || !value.material) {
                        throw new Error('product_attributes phải chứa brand, size và material cho loại Furniture');
                    }
                }
            }
            return true;
        }),
    
    body('product_ratingsAverage')
        .optional()
        .isFloat({ min: 1, max: 5 }).withMessage('product_ratingsAverage phải là số thực từ 1 đến 5'),
    
    body('product_variation')
        .optional()
        .isArray().withMessage('product_variation phải là mảng'),
    
    body('isDraft')
        .optional()
        .isBoolean().withMessage('isDraft phải là boolean'),
    
    body('isPublished')
        .optional()
        .isBoolean().withMessage('isPublished phải là boolean')
];

module.exports = {
    createProductValidator,
    updateProductValidator
};
