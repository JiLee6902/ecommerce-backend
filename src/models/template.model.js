
'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Template'
const COLLECTION_NAME = 'Templates'


const templateSchema = new Schema({
    tem_id: {
        type: Number,
        required: true
    },
    tem_name: {
        type: String,
        required: true
    },
    tem_status: {
        type: String,
        default: 'active',
    },
    tem_html: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


module.exports =
    model(DOCUMENT_NAME, templateSchema);
