const { getEs } = require('../dbs/init.elasticsearch');
const { BadRequestError } = require('../core/error.response');
const { product } = require('../models/product.model');
const Category = require('../models/category.model');
const Shop = require('../models/shop.model');
const ShopSale = require('../models/shopSale.model');



class ElasticsearchService {
  constructor() {
    this.client = null;
    this.productIndex = 'products';
    this.categoryIndex = 'categories';
    this.shopIndex = 'shops';
    this.shopSalesIndex = 'shop_sales';
  }

  async initialize() {
    this.client = getEs().elasticClient;
    if (!this.client) {
      throw new Error('Elasticsearch client not initialized');
    }
    await this.createProductIndex();
    await this.createCategoryIndex();
    await this.createShopIndex();
    await this.createShopSalesIndex();
  }

  async createProductIndex() {
    const indexExists = await this.client.indices.exists({ index: this.productIndex });
    if (!indexExists) {
      await this.client.indices.create({
        index: this.productIndex,
        body: {
          settings: {
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'word_delimiter']
                }
              }
            }
          },
          mappings: {
            properties: {
              product_name: {
                type: 'text',
                analyzer: 'custom_analyzer',
                fields: {
                  suggest: {
                    type: 'completion',
                    analyzer: 'custom_analyzer'
                  },
                  keyword: {
                    type: 'keyword'
                  }
                }
              },
              product_description: {
                type: 'text'
              },
              product_price: { type: 'float' },
              product_type: { type: 'keyword' },
              product_shop: { type: 'keyword' },
              product_category: { type: 'keyword' },
              product_attributes: { type: 'object' },
              product_ratingsAverage: { type: 'float' },
              isPublished: { type: 'boolean' },
              isDraft: { type: 'boolean' },
              total_sales_count: { type: 'integer' },
              created_at: { type: 'date' }
            }
          }
        }
      });
    }
  }

  async createCategoryIndex() {
    const indexExists = await this.client.indices.exists({ index: this.categoryIndex });
    if (!indexExists) {
      await this.client.indices.create({
        index: this.categoryIndex,
        body: {
          mappings: {
            properties: {
              category_name: { type: 'text' },
              category_description: { type: 'text' },
              category_type: { type: 'keyword' },
              gender: { type: 'keyword' },
              isDeleted: { type: 'boolean' }
            }
          }
        }
      });
    }
  }

  async createShopIndex() {
    const indexExists = await this.client.indices.exists({ index: this.shopIndex });
    if (!indexExists) {
      await this.client.indices.create({
        index: this.shopIndex,
        body: {
          mappings: {
            properties: {
              name: { type: 'text' },
              email: { type: 'keyword' },
              status: { type: 'keyword' },
              verify: { type: 'boolean' },
              role: { type: 'keyword' },
            }
          }
        }
      });
    }
  }

  async createShopSalesIndex() {
    const indexExists = await this.client.indices.exists({ index: this.shopSalesIndex });
    if (!indexExists) {
      await this.client.indices.create({
        index: this.shopSalesIndex,
        body: {
          mappings: {
            properties: {
              shop_id: { type: 'keyword' },
              product_id: { type: 'keyword' },
              product_name: { type: 'text' },
              sales_count: { type: 'integer' }
            }
          }
        }
      });
    }
  }

  async addProduct(productData) {
    try {
      await this.client.create({
        index: this.productIndex,
        id: productData._id.toString(),
        body: {
          product_name: productData.product_name,
          product_description: productData.product_description,
          product_price: productData.product_price,
          product_type: productData.product_type,
          product_shop: productData.product_shop.toString(),
          product_category: productData.product_category.toString(),
          product_attributes: productData.product_attributes,
          product_ratingsAverage: productData.product_ratingsAverage,
          isPublished: productData.isPublished,
          isDraft: productData.isDraft,
          total_sales_count: 0,
          created_at: new Date(),
          suggest: {
            input: [
              productData.product_name
            ]
          }
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to add product');
    }
  }

  async getProductSuggestions(prefix, size = 5) {
    try {
      const result = await this.client.search({
        index: this.productIndex,
        body: {
          suggest: {
            product_suggestions: {
              prefix,
              completion: {
                field: 'product_name.suggest', // Field này phải là type completion
                size,
                fuzzy: {
                  fuzziness: 1
                }
              }
            }
          }
        }
      });

      return result.body.suggest.product_suggestions[0].options.map(option => ({
        text: option._source.product_name,
        score: option._score
      }));
    } catch (error) {
      throw new BadRequestError('Failed to get suggestions');
    }
  }

  async addShopSales(shopSalesData) {
    try {
      await this.client.index({
        index: this.shopSalesIndex,
        id: `${shopSalesData.shop_id}_${shopSalesData.product_id}`,
        body: {
          shop_id: shopSalesData.shop_id.toString(),
          product_id: shopSalesData.product_id.toString(),
          product_name: shopSalesData.product_name,
          sales_count: shopSalesData.sales_count
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to shop sales');
    }
  }

  async updateProduct(productId, updateData) {
    try {
      await this.client.update({
        index: this.productIndex,
        id: productId,
        body: {
          doc: updateData
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to update product');
    }
  }

  async addCategory(categoryData) {
    try {
      await this.client.create({
        index: this.categoryIndex,
        id: categoryData._id.toString(),
        body: {
          category_name: categoryData.category_name,
          category_description: categoryData.category_description,
          category_type: categoryData.category_type,
          gender: categoryData.gender,
          isDeleted: categoryData.isDeleted
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to category');
    }
  }

  async addShop(shopData) {
    try {
      await this.client.create({
        index: this.shopIndex,
        id: shopData._id.toString(),
        body: {
          name: shopData.name,
          email: shopData.email,
          status: shopData.status,
          verify: shopData.verify,
          role: shopData.role.toString()
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to shop');
    }
  }

  async addShopSales(shopSalesData) {
    try {
      await this.client.create({
        index: this.shopSalesIndex,
        id: `${shopSalesData.shop_id}_${shopSalesData.product_id}`,
        body: {
          shop_id: shopSalesData.shop_id.toString(),
          product_id: shopSalesData.product_id.toString(),
          product_name: shopSalesData.product_name,
          sales_count: shopSalesData.sales_count
        }
      });
    } catch (error) {
      console.error('Error adding shop sales to Elasticsearch:', error);
      throw new BadRequestError('Failed to index shop sales');
    }
  }

  async updateCategory(categoryId, updateData) {
    try {
      await this.client.update({
        index: this.categoryIndex,
        id: categoryId,
        body: {
          doc: updateData
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to update category');
    }
  }

  async updateShop(shopId, updateData) {
    try {
      await this.client.update({
        index: this.shopIndex,
        id: shopId,
        body: {
          doc: updateData
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to update shop');
    }
  }

  async updateShopSale(shopSaleId, productId, updateData) {
    try {
      await this.client.update({
        index: this.shopSalesIndex,
        id: `${shopSaleId}_${productId}`,
        body: {
          doc: updateData
        }
      });
    } catch (error) {
      throw new BadRequestError('Failed to update shop sale');
    }
  }

  async searchProducts(keyword, filters = {}, from = 0, size = 20) {
    const { product_type, min_price, max_price, sort_by, order } = filters;

    let body = {
      query: {
        bool: {
          must: [
            { multi_match: { query: keyword, fields: ['product_name', 'product_description'], operator: 'or', fuzziness: '2' } }
          ],
          filter: [
            { term: { isPublished: true } },
            { term: { isDraft: false } }
          ]
        }
      },
      from,
      size
    };

    if (product_type) {
      body.query.bool.filter.push({ term: { product_type } });
    }

    if (min_price || max_price) {
      let range = { product_price: {} };
      if (min_price) range.product_price.gte = min_price;
      if (max_price) range.product_price.lte = max_price;
      body.query.bool.filter.push({ range });
    }

    if (sort_by) {
      body.sort = [{ [sort_by]: { order: order || 'desc' } }];
    }


    try {
      const result = await this.client.search({
        index: this.productIndex,
        body
      });

      return {
        total: result.body.hits.total.value,
        products: result.body.hits.hits.map(hit => ({
          _id: hit._id,
          ...hit._source
        }))
      };
    } catch (error) {
      throw new BadRequestError('Failed to search products');
    }
  }

  async searchCategories(keyword, filters = {}, from = 0, size = 20) {
    const { category_type, gender } = filters;

    let body = {
      query: {
        bool: {
          must: [
            { multi_match: { query: keyword, fields: ['category_name', 'category_description'], fuzziness: '2' } }
          ],
          filter: [
            { term: { isDeleted: false } },
          ]
        }
      },
      from,
      size
    };

    if (category_type) {
      body.query.bool.filter.push({ term: { category_type } });
    }

    if (gender) {
      body.query.bool.filter.push({ term: { gender } });
    }

    try {
      const result = await this.client.search({
        index: this.categoryIndex,
        body
      });

      return {
        total: result.body.hits.total.value,
        categories: result.body.hits.hits.map(hit => ({
          _id: hit._id,
          ...hit._source
        }))
      };
    } catch (error) {
      throw new BadRequestError('Failed to search categories');
    }
  }

  async searchShops(keyword, from = 0, size = 20) {

    let body = {
      query: {
        bool: {
          must: [
            { multi_match: { query: keyword, fields: ['name'], fuzziness: '2' } }
          ],
          filter: [
            { term: { verify: true } },
            { term: { status: "active" } },
          ]
        }
      },
      from,
      size
    };

    try {
      const result = await this.client.search({
        index: this.shopIndex,
        body
      });

      return {
        total: result.body.hits.total.value,
        shops: result.body.hits.hits.map(hit => ({
          _id: hit._id,
          ...hit._source
        }))
      };
    } catch (error) {
      throw new BadRequestError('Failed to search shops');
    }
  }

  async searchProductsAndTopShops(keyword, { from = 0, size = 20 }) {
    const productQuery = {
      index: this.productIndex,
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: keyword,
                  fields: ['product_name^3', 'product_description'],
                  fuzziness: '2'
                }
              }
            ],
            filter: [
              { term: { isPublished: true } },
              { term: { isDraft: false } }
            ]
          }
        },
        sort: [
          { total_sales_count: { order: 'desc' } }
        ],
        from,
        size
      }
    };


    const shopSalesQuery = {
      index: this.shopSalesIndex,
      body: {
        query: {
          match: { product_name: keyword }
        },
        sort: [
          { sales_count: { order: 'desc' } }
        ],
        size: 3,
      }
    };

    try {
      const [productResults, shopSalesResults] = await Promise.all([
        this.client.search(productQuery),
        this.client.search(shopSalesQuery)
      ]);

      const products = productResults.body.hits.hits.map(hit => ({
        _id: hit._id,
        ...hit._source
      }));

      const topShops = shopSalesResults.body.hits.hits.map(hit => ({
        shop_id: hit._source.shop_id,
        top_product: hit._source
      }));

      return {
        products,
        topShops,
        total: productResults.body.hits.total.value
      };
    } catch (error) {
      throw new BadRequestError('Failed!');
    }
  }


  async syncProductsToElasticsearch() {
    const products = await product.find({ isPublished: true }).lean();
    const operations = products.flatMap(doc => [
      { index: { _index: this.productIndex, _id: doc._id.toString() } },
      {
        product_name: doc.product_name,
        product_description: doc.product_description,
        product_price: doc.product_price,
        product_type: doc.product_type,
        product_shop: doc.product_shop.toString(),
        product_attributes: doc.product_attributes,
        isPublished: doc.isPublished
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.client.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.error('Error for bulk');
      }
    }
  }

  async syncCategoriesToElasticsearch() {
    const categories = await Category.find({ isDeleted: false }).lean();
    const operations = categories.flatMap(doc => [
      { index: { _index: this.categoryIndex, _id: doc._id.toString() } },
      {
        category_name: doc.category_name,
        category_description: doc.category_description,
        category_type: doc.category_type,
        gender: doc.gender,
        isDeleted: doc.isDeleted
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.client.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.error('Error for bulk');
      }
    }
  }

  async syncShopsToElasticsearch() {
    const shops = await Shop.find().lean();
    const operations = shops.flatMap(doc => [
      { index: { _index: this.shopIndex, _id: doc._id.toString() } },
      {
        name: doc.name,
        email: doc.email,
        status: doc.status,
        verify: doc.verify,
        role: doc.role.toString()
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.client.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.error('Errors occurred during bulk indexing of shops');
      }
    }
  }

  async syncShopSalesToElasticsearch() {
    const shops = await ShopSale.find().lean();
    const operations = shops.flatMap(doc => [
      { index: { _index: this.shopIndex, _id: doc._id.toString() } },
      {
        shop_id: doc.shop_id.toString(),
        product_id: doc.product_id.toString(),
        product_name: doc.product_name,
        sales_count: doc.sales_count
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.client.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.error('Errors occurred during bulk indexing of shop sales');
      }
    }
  }
}

module.exports = new ElasticsearchService();