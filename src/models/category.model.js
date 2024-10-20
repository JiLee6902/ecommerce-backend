'use strict'

const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Category';
const COLLECTION_NAME = 'Categories';

const categorySchema = new Schema({
    category_name: {
        type: String,
        required: true,
        trim: true
    },
    category_slug: {
        type: String,
        required: true,
        unique: true
    },
    category_parent: {
        type: Schema.Types.ObjectId,
        ref: DOCUMENT_NAME,
        default: null
    },
    category_level: {
        type: Number,
        default: 1
    },
    category_description: {
        type: String,
        trim: true
    },
    category_type: {
        type: String,
        enum: ['Electronics', 'Clothing', 'Furniture', 'Accessories', 'Beauty'],
        default: 'Clothing'
    },
    gender: {
        type: [String],
        enum: ['Men', 'Women', 'Unisex', 'Kids'],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

categorySchema.index({ category_name: 1 });
categorySchema.index({ category_type: 1 });
categorySchema.index({ gender: 1 });



categorySchema.pre('save', function (next) {
    this.category_slug = slugify(this.category_name, {
        lower: true
    });
    next();
});


module.exports = model(DOCUMENT_NAME, categorySchema);


