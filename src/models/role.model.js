
'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Role'
const COLLECTION_NAME = 'Roles'

/*
const grantList = [                             
    //update: any - tất cả user 
    // update: own - chỉ cho update bản thân mình
    { role: 'admin', resource: 'profile', action: 'update:any', attributes: '*' },
    //attribute là cho update các trường nào: ví dụ như trường name, phone, ...
    // * là update tất cả các trường có trong userSchema
    // *,!password là update tất cả trừ name 
    { role: 'user', resource: 'profile', action: 'update:own', attributes: '*' },
    { role: 'user', resource: 'profile', action: 'read:own', attributes: '*' },
]
*/
const roleSchema = new Schema({
    rol_name: {
        type: String,
        default: 'user',
        enum: ['user', 'shop', 'admin', 'staff']
    },
    rol_slug: {
        type: String,
        required: true

    },
    rol_status: {
        type: String,
        default: 'active',
        enum: ['active', 'block', 'pending']
    },
    rol_description: {
        type: String,
        default: '',
    },
    rol_grants: [
        {
            resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
            actions: [{ type: String, required: true }],
            attributes: { type: String, default: '*' }
        }
    ],
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


module.exports =
    model(DOCUMENT_NAME, roleSchema);
