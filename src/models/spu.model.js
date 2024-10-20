'use strict'


const { model, Schema, Types } = require('mongoose');
const slugify = require('slugify');


const DOCUMENT_NAME = 'Spu'
const COLLECTION_NAME = 'Spus'

const spuSchema = new Schema({
    product_id: {
        type: String,
        default: ''
    },
    product_name: {
        type: String,
        trim: true,
    },
    product_thumb: {
        type: String,
        trim: true,
    },
    product_brand: {
        type: String,
        trim: true,
    },
    product_description: String,
    product_slug: String,
    product_price: {
        type: Number,
        trim: true,
    },
    product_category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    product_quantity: {
        type: Number,
        default: 0,
    },
    product_quantity_sold: {
        type: Number,
        default: 0,
    },
    product_discount: {
        type: Number,
        default: 0
    },
    product_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    },
    product_tags: {
        type: [String],
        default: []
    },
    product_attributes: {
        type: Schema.Types.Mixed,
        trim: true,
    },
    /*
        {
           attribute_id: 12345, //style áo [han quôc, thời trang]
           attribute_values: [
              {
                 value_id: 123
              }
           ]   
        },

        {
           attribute_id: 5678, //samsung [gọn, sac net..]
           attribute_values: [
              {
                 value_id: 123
              }
           ]   
        }
    */
    product_ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be bottom 1.0'],
        set: (val) => Math.round(val * 10) / 10
    },
    product_variations: {
        type: [{
            images: [String],
            name: String,
            options: [String]
        }],
        default: []
    },
    /*
        [
            {
                images:[],
                name: 'color',
                options: ['red', 'blue']
            },
            {
                name: 'size',
                options: ['S', 'M'],
                images: []
            }
        ]
    */
    isDraft: {
        type: Boolean,
        default: true,
        index: true,
        select: false
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true,
        select: false
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
        select: false
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

spuSchema.index(
    { product_name: 'text', product_description: 'text' },
    {
        weights: {
            product_name: 10,
        }
    }
)
spuSchema.index({ product_category: 1 });
spuSchema.index({ product_price: 1 });
spuSchema.index({ product_tags: 1 });


spuSchema.pre('save', function (next) {
    this.product_slug = slugify(this.product_name, {
        lower: true
    })
    next();
})





module.exports = model(DOCUMENT_NAME, spuSchema)


