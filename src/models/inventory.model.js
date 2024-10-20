'use strict'


const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Inventory'
const COLLECTION_NAME = 'Inventories'


const inventorySchema = new Schema({
    inven_shopId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Shop',
        unique: true
    },
    inven_products: [
        {
            inven_productId: {
                type: Schema.Types.ObjectId,
                required: false,
                ref: 'Product'
            },
            inven_stock: {
                type: Number,
                required: false,
                default: 0
            },

        }
    ],
    inven_reservations: {
        type: Array,
        default: []
    },
    // inven_reservations: [
    //     {
    //         quantity: Number,
    //         cartId: String,
    //         status: {
    //             type: String,
    //             enum: ['pending', 'confirmed', 'cancelled'],
    //             default: 'pending'
    //         },
    //         createdOn: {
    //             type: Date,
    //             default: Date.now,
    //             expires: 60*30 // tự động xóa sau 30 phút nếu không được xác nhận
    //         }
    //     }
    // ],
    inven_version: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});


module.exports = {
    inventory: model(DOCUMENT_NAME, inventorySchema)
}