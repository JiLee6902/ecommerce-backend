'use strict'


const { model, Schema, Types } = require('mongoose');
const slugify = require('slugify');


const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'



const productSchema = new Schema({
    product_category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    product_name: {
        type: String,
        trim: true,
    },
    product_thumb: {
        type: String,
        trim: true,
    },
    product_description: String,
    product_slug: String,
    product_price: {
        type: Number,
        trim: true,
    },
    product_quantity: {
        type: Number,
        trim: true,
    },
    product_type: {
        type: String,
        trim: true,
        enum: ['Electronics', 'Clothing', 'Furniture']
    },
    product_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    },
    product_attributes: {
        type: Schema.Types.Mixed,
        trim: true,
    },
    product_ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be bottom 1.0'],
        set: (val) => Math.round(val * 10) / 10
    },
    product_variation: {
        type: Array,
        default: []
    },
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
    total_sales_count: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

productSchema.index({ product_name: 1 });
productSchema.index({ product_price: 1 });


productSchema.index(
    { product_name: 'text', product_description: 'text' },
    {
        weights: {
            product_name: 10,
            product_description: 5
        }
    }
)

productSchema.pre('save', function (next) {
    this.product_slug = slugify(this.product_name, {
        lower: true
    })
    next();
})


const clothingSchema = new Schema({
    brand: {
        type: String,
        require: true
    },
    size: String,
    material: String,
    product_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    }
},
    {
        timestamps: true,
        collection: 'clothes'
    })

const electronicSchema = new Schema({
    manufacturer: {
        type: String,
        require: true
    },
    model: String,
    color: String,
    product_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    }
},
    {
        timestamps: true,
        collection: 'electronics'
    })

const furnitureSchema = new Schema({
    brand: {
        type: String,
        require: true
    },
    size: String,
    material: String,
    product_shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    }
},
    {
        timestamps: true,
        collection: 'furnitures'
    })



module.exports = {
    product: model(DOCUMENT_NAME, productSchema),
    electronic: model('Electronics', electronicSchema),
    clothing: model('Clothing', clothingSchema),
    furniture: model('Furniture', furnitureSchema),
};