
'use strict'

const { ForbiddenError } = require('../core/error.response');
const USER = require('../models/user.model');

const isAdmin = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const user = await USER.findById(userId).populate('usr_role').lean();
        
        if (!user) {
            throw new ForbiddenError('User not found');
        }

        if (user.usr_role?.rol_name !== 'admin' || user.usr_status !== 'active') {
            throw new ForbiddenError('Access denied. Admin privileges required.');
        }

        req.userRole = user.usr_role;
        
        next();
    } catch (error) {
        next(error);
    }
}

const hasRole = (roleName) => {
    return async (req, res, next) => {
        try {
            const { userId } = req.user;
            
            const user = await USER.findById(userId).populate('usr_role').lean();
            
            if (!user) {
                throw new ForbiddenError('User not found');
            }
            if (user.usr_role?.rol_name !== roleName || user.usr_status !== 'active') {
                throw new ForbiddenError(`Access denied. ${roleName} role required.`);
            }

            req.userRole = user.usr_role;
            
            next();
        } catch (error) {
            next(error);
        }
    }
}

const hasAnyRole = (roleNames) => {
    return async (req, res, next) => {
        try {
            const { userId } = req.user;
            
            const user = await USER.findById(userId).populate('usr_role').lean();
            
            if (!user) {
                throw new ForbiddenError('User not found');
            }

            if (!roleNames.includes(user.usr_role?.rol_name) || user.usr_status !== 'active') {
                throw new ForbiddenError('Access denied. Insufficient privileges.');
            }

            req.userRole = user.usr_role;
            
            next();
        } catch (error) {
            next(error);
        }
    }
}

const hasPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const { userId } = req.user;
            
            const user = await USER.findById(userId).populate('usr_role').lean();
            
            if (!user) {
                throw new ForbiddenError('User not found');
            }

            if (user.usr_status !== 'active') {
                throw new ForbiddenError('Account is not active');
            }

            const hasRequiredPermission = user.usr_role.rol_grants.some(grant => 
                grant.resource.toString() === resource && 
                grant.actions.includes(action)
            );

            if (!hasRequiredPermission) {
                throw new ForbiddenError('Access denied. Insufficient permissions.');
            }

            req.userRole = user.usr_role;
            
            next();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    isAdmin,
    hasRole,
    hasAnyRole,
    hasPermission
}