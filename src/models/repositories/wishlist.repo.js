
const User = require('../user.model')
const { product } = require('../product.model')


class WishlistService {
    static async addToWishlist(userId, productId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        const productExists = await product.findById(productId);
        if (!productExists) {
            throw new NotFoundError('Product not found');
        }
        if (user.usr_wishlist.includes(productId)) {
            return {
                message: 'Product already in wishlist',
                wishlist: user.usr_wishlist
            };
        }
        user.usr_wishlist.push(productId);
        await user.save();

        const populatedUser = await User.findById(userId).populate('usr_wishlist');

        return {
            message: 'Product added to wishlist',
            wishlist: populatedUser.usr_wishlist
        };
    }

    static async removeFromWishlist(userId, productId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        user.usr_wishlist = user.usr_wishlist.filter(id => id.toString() !== productId);
        await user.save();
        const populatedUser = await User.findById(userId).populate('usr_wishlist');

        return {
            message: 'Product removed from wishlist',
            wishlist: populatedUser.usr_wishlist
        };
    }

    static async getWishlist(userId) {
        const user = await User.findById(userId).populate({
            path: 'usr_wishlist',
            select: 'product_name product_thumb product_price product_quantity product_description',
            populate: {
                path: 'product_shop',
                select: 'name email'
            }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return {
            wishlist: user.usr_wishlist,
            count: user.usr_wishlist.length
        };
    }

    static async clearWishlist(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        user.usr_wishlist = [];
        await user.save();

        return {
            message: 'Wishlist cleared',
            wishlist: []
        };
    }
}

module.exports = WishlistService