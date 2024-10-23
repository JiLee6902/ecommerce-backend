

'use strict'
const { BadRequestError } = require('../core/error.response');
const RESOURCE = require('../models/resource.model');
const ROLE = require('../models/role.model');
const SHOP = require('../models/shop.model');

const staffModel = require('../models/staff.model');
const USER = require('../models/user.model');
/**
 * new resouce
 * @param {string} name
 * @param {string} slug
 * @param {string} description
 * 
 */

const createResource = async ({
    name
    , slug
    , description
}) => {
    try {

        const resource = await RESOURCE.create({
            src_name: name,
            src_slug: slug,
            src_description: description
        })

        return resource;
    } catch (error) {
        return error;
    }
}


const resourceList = async ({
    userId = 0,
    limit = 30,
    offset = 0,
    search = ''
}) => {
    try {
        //check admin

        const resources = await RESOURCE.aggregate([
            {
                $project: {
                    _id: 0,
                    name: '$src_name',
                    slug: '$src_slug',
                    description: '$src_description',
                    resourceId: '$_id',
                    createdAt: 1
                }
            }
        ])
        return resources;
    } catch (error) {
        return [];
    }
}


const createRole = async ({
    name = '',
    slug = '',
    description = '',
    grants = []
}) => {
    try {
        const role = ROLE.create({
            rol_name: name,
            rol_slug: slug,
            rol_description: description,
            rol_grants: grants
        })
        return role;
    } catch (error) {
        return error;
    }
}

const updateRole = async ({
    rol_name ,rol_grants 
}) => {
    try {
        const role = await ROLE.updateOne(
            { rol_name: rol_name },
            { $push: { rol_grants: { $each: rol_grants } } } 
        );
        return role;
    } catch (error) {
        return error;
    }
}



const roleList = async ({
    userId = 0,
    limit = 30,
    offset = 0,
    search = ''
}) => {
    try {
        const models = [USER, SHOP, staffModel];
        const roles = ['usr_role', 'role', 'staff_role'];

        let roleName ;
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            const roleField = roles[i];
            const account = await model.findById(userId);

            if (account) {
                roleName = account[roleField];
                break; 
            }
        }
        const role = await ROLE.findOne({
            rol_name: roleName
        })

        if (!role) throw new BadRequestError("Not exist this role in the system")

        const roleList = await ROLE.aggregate([
            {
                $match: { _id: { $in: role._id } }
            },
            {
                $unwind: "$rol_grants"
            },
            {
                $lookup: {
                    from: 'Resources', 
                    localField: 'rol_grants.resource',
                    foreignField: '_id',
                    as: 'resource'
                }
            },
            {
                $unwind: "$resource"
            },
            {
                $unwind: "$rol_grants.actions"
            },
            {
                $project: {
                    _id: 0,
                    role: '$rol_name',
                    resource: '$resource.src_name',
                    action: '$rol_grants.actions',
                    attributes: '$rol_grants.attributes',

                }
            }
        ])
        return roleList;
    } catch (error) {
        return error;
    }
}


module.exports = {
    createResource,
    resourceList,
    createRole,
    roleList,
    updateRole
}
