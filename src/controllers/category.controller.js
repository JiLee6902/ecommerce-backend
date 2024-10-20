'use strict'

const CategoryService = require('../services/category.service')
const { SuccessResponse } = require('../core/success.response')

class CategoryController {
    createCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Category success',
            metadata: await CategoryService.createCategory(req.user.userId, req.body)
        }).send(res);
    }

    updateCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Category success',
            metadata: await CategoryService.updateCategory(
                req.user.userId, req.params.categoryId, req.body
            )
        }).send(res);
    }

    getAllCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all Categories success',
            metadata: await CategoryService.getAllCategories(req.query)
        }).send(res);
    }

    getCategoryById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Category by ID success',
            metadata: await CategoryService.getCategoryById(req.params.categoryId)
        }).send(res);
    }

    getCategoryBySlug = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Category by slug success',
            metadata: await CategoryService.getCategoryBySlug(req.params.slug)
        }).send(res);
    }

    deleteCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete Category success',
            metadata: await CategoryService.deleteCategory(req.user.userId, req.params.categoryId)
        }).send(res);
    }

    getCategoriesByType = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Categories by type success',
            metadata: await CategoryService.getCategoriesByType(req.params.type)
        }).send(res);
    }

    getCategoriesByGender = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get Categories by gender success',
            metadata: await CategoryService.getCategoriesByGender(req.params.gender)
        }).send(res);
    }

    getChildCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get child Categories success',
            metadata: await CategoryService.getChildCategories(req.params.parentId)
        }).send(res);
    }

    searchCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search Categories success',
            metadata: await CategoryService.searchCategories(req.query.keyword)
        }).send(res);
    }

    filterProductsByCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Filter Products by Category success',
            metadata: await CategoryService.filterProductsByCategory(
                req.params.categoryId,
                req.query
            )
        }).send(res);
    }

    // /search?keyword=abc&limit=10&page=2&category_type=electronics&gender=male
    searchCategories = async (req, res, next) => {
        const { keyword, limit, page, ...filterParams } = req.query;
        new SuccessResponse({
            message: 'Search Categories success',
            metadata: await CategoryService.searchCategories(keyword, {
                limit: parseInt(limit, 10) || 50,
                page: parseInt(page, 10) || 1,
                filter: { ...filterParams, isDeleted: false }
            })
        }).send(res);
    }
}

module.exports = new CategoryController()