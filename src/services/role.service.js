'use strict'

const { BadRequestError, ForbiddenError } = require("../core/error.response");
const Role = require("../models/role.model");
const { convertToObjectIdMongoDb } = require("../utils");

class RoleService {
    static async createRole({ rol_name, rol_slug, rol_description, rol_grants }) {
        const existingRole = await Role.findOne({ rol_slug }).lean();
        if (existingRole) {
            throw new BadRequestError('Role already exists');
        }

        const newRole = await Role.create({
            rol_name,
            rol_slug,
            rol_description,
            rol_grants
        });

        return newRole;
    }

    static async updateRole({ roleId, updateData }) {
        const role = await Role.findById(roleId);
        if (!role) {
            throw new BadRequestError('Role not found');
        }

        if (role.rol_name === 'admin' && updateData.rol_name !== 'admin') {
            throw new ForbiddenError('Cannot modify admin role');
        }

        const updatedRole = await Role.findByIdAndUpdate(
            roleId,
            updateData,
            { new: true }
        );

        return updatedRole;
    }

    static async deleteRole(roleId) {
        const role = await Role.findById(roleId);
        if (!role) {
            throw new BadRequestError('Role not found');
        }
        if (role.rol_name === 'admin') {
            throw new ForbiddenError('Cannot delete admin role');
        }

        await Role.findByIdAndDelete(roleId);
        return { message: 'Role deleted successfully' };
    }

    static async getRoleById(roleId) {
        const role = await Role.findById(roleId).lean();
        if (!role) {
            throw new BadRequestError('Role not found');
        }
        return role;
    }

    static async getAllRoles({ limit = 20, page = 1, filter = {} }) {
        const skip = (page - 1) * limit;
        const roles = await Role.find(filter)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Role.countDocuments(filter);

        return {
            roles,
            total,
            page,
            limit
        };
    }

    static async updateRoleStatus({ roleId, status }) {
        const role = await Role.findById(roleId);
        if (!role) {
            throw new BadRequestError('Role not found');
        }

        if (role.rol_name === 'admin') {
            throw new ForbiddenError('Cannot modify admin role status');
        }

        role.rol_status = status;
        await role.save();

        return role;
    }

    static async updateRoleGrants({ roleId, grants }) {
        const role = await Role.findById(roleId);
        if (!role) {
            throw new BadRequestError('Role not found');
        }

        role.rol_grants = grants;
        await role.save();

        return role;
    }
}

module.exports = RoleService;