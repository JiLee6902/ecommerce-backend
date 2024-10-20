'use strict'


const { model, Schema, Types } = require('mongoose');
const slugify = require('slugify');


const DOCUMENT_NAME = 'Sku'
const COLLECTION_NAME = 'Skus'



const skuSchema = new Schema({
    sku_id: {
        type: String,
        require: true,
        unique: true   // string "{spu_id}123-{shop_id}"
    },
    sku_tier_idx: {
        type: Array,
        default: [0]     // [1,0], [1,1]
    },
    /*
       color = [red, blue] [0, 1]
       size = [S, M] [0, 1]

       => red+S = [0,0]
    */
    sku_default: {
        type: Boolean,
        default: true
    },
    sku_slug: {
        type: String,
        default: ''
    },
    sku_sort: {
        type: Number,
        default: 0
    },
    sku_price: {
        type: String,
        required: true
    },
    sku_stock: {
        type: Number,
        default: 0
    },
    sku_weight: {
        type: Number,
        default: 0
    },
    sku_dimensions: {
        type: {
            length: Number,
            width: Number,
            height: Number
        },
        default: {}
    },
    sku_images: {
        type: [String],
        default: []
    },
    sku_barcode: {
        type: String,
        trim: true
    },
    sku_discount: {
        type: Number,
        default: 0
    },
    product_id: {
        type: String,
        required: true
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

skuSchema.index({ sku_id: 1 });
skuSchema.index({ sku_id: 1, product_id: 1 });


module.exports = model(DOCUMENT_NAME, skuSchema);


/*
sku_weight: Theo dõi trọng lượng của SKU, có thể cần thiết cho việc tính toán phí vận chuyển hoặc quản lý kho.

sku_dimensions: Bao gồm các kích thước của SKU để hỗ trợ tính toán và quản lý logistics (dài, rộng, cao).

sku_images: Danh sách các URL của hình ảnh đặc trưng cho SKU, hỗ trợ việc hiển thị hình ảnh trong cửa hàng trực tuyến.

sku_barcode: Được sử dụng cho việc quét mã vạch, hữu ích cho việc quản lý hàng tồn kho và xử lý đơn hàng.

sku_discount: Theo dõi mức giảm giá áp dụng cho SKU, giúp hỗ trợ các chương trình khuyến mãi và giảm giá.
*/