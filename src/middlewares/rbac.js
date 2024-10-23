
'use strict'

const { extractUserIdFromToken } = require('../auth/authUtils');
const { AuthFailureError } = require('../core/error.response');
const { roleList } = require('../services/rbac.service');
const rbac = require('./role.middleware')

const grantAccess = (action, resource, options={}) => {
    return async (req, res, next) => {
        try {
            const userId = extractUserIdFromToken(req)
            rbac.setGrants(await roleList({
                userId
            }))

            const models = [USER, SHOP, staffModel];
            const roleFields = ['usr_role', 'role', 'staff_role'];

            let userRole;
            for (let i = 0; i < models.length; i++) {
                const model = models[i];
                const roleField = roleFields[i];
                const account = await model.findById(userId);

                if (account) {
                    userRole = account[roleField];
                    break;
                }
            }

            if (!userRole) {
                throw new AuthFailureError('Role not found for this user');
            }

            const permission = rbac.can(userRole)[action](resource);
            if (!permission.granted) {
                throw new AuthFailureError(`You don't have this permission!`)
            }

            const allowedAttributes = permission.attributes;
            if (allowedAttributes === '*') {
                return next();
            }

            if (req.body && Object.keys(req.body).length) {
                const filteredBody = {};
                const unauthorizedFields = [];

                Object.keys(req.body).forEach(field => {
                    if (allowedAttributes.includes(field)) {
                        filteredBody[field] = req.body[field];
                    } else {
                        unauthorizedFields.push(field);
                    }
                });

                if (options.strict && unauthorizedFields.length > 0) {
                    throw new AuthFailureError(
                        `Unauthorized attempt to modify restricted fields: ${unauthorizedFields.join(', ')}`
                    );
                }

                req.body = filteredBody;
            }
            next();
        } catch (error) {
            next(error);
        }
    }
}


module.exports = {
    grantAccess
}

