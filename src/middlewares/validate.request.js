
const { validationResult } = require('express-validator');

/**
 * Middleware để kiểm tra các rules xác thực
 * @param {Array} validations 
 * @returns 
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({ errors: errors.array() });
    };
};

module.exports = validateRequest;


