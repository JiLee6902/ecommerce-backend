
'use strict'

const { AuthFailureError } = require('../core/error.response');
const { roleList } = require('../services/rbac.service');
const rbac = require('./role.middleware')

const grantAccess = (action, resource) => {
    return async (req, res, next) => {
        try {
            const userId = extractUserIdFromToken(req)
            rbac.setGrants( await roleList({
                userId
            }))
            const rol_name = req.query.role;
            const permission = rbac.can(rol_name)[action](resource);
            if (!permission.granted) {
                throw new AuthFailureError(`You don't have this permission!`)
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

