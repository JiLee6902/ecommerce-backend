'use strict'

const { SuccessResponse } = require("../core/success.response");
const RoleService = require("../services/role.service");

class RoleController {
    createRole = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new role success',
            metadata: await RoleService.createRole(req.body)
        }).send(res);
    }

    updateRole = async (req, res, next) => {
        const { id } = req.params;
        new SuccessResponse({
            message: 'Update role success',
            metadata: await RoleService.updateRole({
                roleId: id,
                updateData: req.body
            })
        }).send(res);
    }

    deleteRole = async (req, res, next) => {
        const { id } = req.params;
        new SuccessResponse({
            message: 'Delete role success',
            metadata: await RoleService.deleteRole(id)
        }).send(res);
    }

    getRoleById = async (req, res, next) => {
        const { id } = req.params;
        new SuccessResponse({
            message: 'Get role success',
            metadata: await RoleService.getRoleById(id)
        }).send(res);
    }

    getAllRoles = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get roles success',
            metadata: await RoleService.getAllRoles(req.query)
        }).send(res);
    }

    updateRoleStatus = async (req, res, next) => {
        const { id } = req.params;
        const { status } = req.body;
        new SuccessResponse({
            message: 'Update role status success',
            metadata: await RoleService.updateRoleStatus({
                roleId: id,
                status
            })
        }).send(res);
    }

    updateRoleGrants = async (req, res, next) => {
        const { id } = req.params;
        const { grants } = req.body;
        new SuccessResponse({
            message: 'Update role grants success',
            metadata: await RoleService.updateRoleGrants({
                roleId: id,
                grants
            })
        }).send(res);
    }
}

module.exports = new RoleController();