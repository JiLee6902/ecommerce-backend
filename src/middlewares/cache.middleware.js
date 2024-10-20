const { CACHE_PRODUCT } = require("../configs/constant");
const { getCacheIO } = require("../models/repositories/cache.repo");



const readCache = async (req, res, next) => {
    const { sku_id } = req.query;
    const skuKeyCache = `${CACHE_PRODUCT.SKU}${sku_id}`;
    let skuCache = await getCacheIO({ key: skuKeyCache });
    if (!skuCache) return next();

    if (skuCache) {
        return res.status(200).json({
            ...JSON.parse(skuCache),
            toLoad: 'cache middleware'
        });
    }
}

module.exports = {
    readCache
}