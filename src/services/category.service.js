'use strict'

const { BadRequestError } = require('../core/error.response');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const User = require('../models/product.model');
const { getSelectData, unGetSelectData } = require('../utils');
const elasticsearchService = require('./elasticsearch.service');

class CategoryService {

    static async createCategory(adminId, payload) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const newCategory = await Category.create(payload);

        await elasticsearchService.addCategory(newCategory);
        return newCategory;
    }

    static async updateCategory(adminId, categoryId, payload) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, payload, { new: true });
        if (!updatedCategory) {
            throw new NotFoundError('Category not found');
        }
        await elasticsearchService.updateCategory(categoryId.toString(), updatedCategory);

        return updatedCategory;
    }

    static async deleteCategory(adminId, categoryId) {
        const admin = await User.findOne({ _id: adminId, usr_role: 'admin' });
        if (!admin) {
            throw new BadRequestError('Permission denied');
        }

        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            throw new NotFoundError('Category not found');
        }
        return { message: 'Category deleted successfully' };
    }
    static async getAllCategories({
        limit = 50,
        page = 1,
        sort = 'ctime',
        filter = { isDeleted: false },
        select = ['category_name', 'category_type', 'gender']
    }) {
        const skip = (page - 1) * limit;
        const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
        const categories = await Category.find(filter)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .select(getSelectData(select))
            .lean();

        return categories;
    }

    static async getCategoryById(categoryId) {
        const category = await Category.findById(categoryId).lean();
        if (!category) {
            throw new BadRequestError('Category not found');
        }
        return category;
    }

    static async getCategoryBySlug(slug) {
        const category = await Category.findOne({ category_slug: slug }).lean();
        if (!category) {
            throw new BadRequestError('Category not found');
        }
        return category;
    }

    static async getCategoriesByType(type) {
        const categories = await Category.find({ category_type: type, isDeleted: false }).lean();
        return categories;
    }

    static async getCategoriesByGender(gender) {
        const categories = await Category.find({ gender: gender, isDeleted: false }).lean();
        return categories;
    }

    static async getChildCategories(parentId) {
        const childCategories = await Category.find({ category_parent: parentId, isDeleted: false }).lean();
        return childCategories;
    }

    static async searchCategories(keyword, {
        limit = 50,
        page = 1,
        filter = { isDeleted: false }
    }) {
        const { categories, total } = await elasticsearchService.searchCategories(keyword, filter, (page - 1) * limit, limit);
        return {
            categories,
            total,
            page,
            limit
        };
    }

    static async filterProductsByCategory(categoryId, {
        limit = 50,
        page = 1,
        sort = 'ctime',
        select = ['product_name', 'product_thumb', 'product_price']
    }) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new BadRequestError('Category not found');
        }

        const skip = (page - 1) * limit;
        const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };


        const subcategories = await this.getAllSubcategories(categoryId);
        const categoryIds = [categoryId, ...subcategories.map(sub => sub._id)];

        const products = await Product.find({
            product_shop: { $in: categoryIds },
            isPublished: true
        })
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .select(getSelectData(select))
            .lean();

        return products;
    }

    static async getAllSubcategories(categoryId) {
        const subcategories = [];
        await getSubcategories(categoryId);

        const getSubcategories = async (parentId) => {
            const children = await Category.find({ category_parent: parentId, isDeleted: false }).lean();

            if (!children || children.length === 0) {
                return;
            }

            for (const child of children) {
                subcategories.push(child);
                await getSubcategories(child._id);
            }
        };

        return subcategories;
    }
}

module.exports = CategoryService;