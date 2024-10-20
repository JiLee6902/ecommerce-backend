
'use strict'

const { getIORedis } = require("../dbs/init.ioredis");
const { setCacheIO, delCacheIO } = require("../models/repositories/cache.repo");


class CartRedisService {
  
    async getCart(cartId) {
      const cartKey = `cart:${cartId}`;
      const cartData = await getIORedis(cartKey);
      return cartData ? JSON.parse(cartData) : null;
    }
  
    async setCart(cartId, cartData) {
      const cartKey = `cart:${cartId}`;
      await setCacheIO(cartKey, JSON.stringify(cartData), 86400)
    }
  
    async deleteCart(cartId) {
      const cartKey = `cart:${cartId}`;
      await delCacheIO(cartKey)
    }
  
    async addToCart(cartId, product) {
      const cartData = await getCart(cartId) || { cart_products: [] };
      const existingProductIndex = cartData.cart_products.findIndex(
        (p) => p.productId === product.productId
      );
  
      if (existingProductIndex > -1) {
        cartData.cart_products[existingProductIndex].quantity += product.quantity;
      } else {
        cartData.cart_products.push(product);
      }
  
      await this.setCart(cartId, cartData);
      return cartData;
    }
  
    async removeFromCart(cartId, productId) {
      const cartData = await this.getCart(cartId);
      if (!cartData) throw new NotFoundError('Cart not found');
  
      cartData.cart_products = cartData.cart_products.filter(
        (p) => p.productId !== productId
      );
  
      await this.setCart(cartId, cartData);
      return cartData;
    }
  
    
  
    async syncCartWithDatabase(userId, cartData) {
      await cart.findOneAndUpdate(
        { cart_userId: userId, cart_state: 'active' },
        {
          $set: {
            cart_products: cartData.cart_products,
            cart_count_product: cartData.cart_products.length,
          },
        },
        { upsert: true, new: true }
      );
    }
  
    generateGuestCartId() {
      return uuidv4();
    }
  }
  
  module.exports = new CartRedisService();