'use strict'


const { model, Schema, Types } = require('mongoose');
const { product } = require('./product.model');
const { convertToObjectIdMongoDb } = require('../utils');

const DOCUMENT_NAME = 'Shop'
const COLLECTION_NAME = 'Shops'



const shopSalesSchema = new Schema({
    shop_id: { type: Schema.Types.ObjectId, ref: 'Shop' },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    product_name: String,
    sales_count: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});
shopSalesSchema.index({ name: 1 });

shopSalesSchema.pre('save', async function (next) {
    if (this.isModified('product_id')) {
        const product = await product.findById(convertToObjectIdMongoDb(this.product_id));
        if (product) {
            this.product_name = product.product_name;
        }
    }
    next();
});


module.exports = model(DOCUMENT_NAME, shopSalesSchema);