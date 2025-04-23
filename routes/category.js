const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { buildCategoryTree } = require('../utils/categoryUtils');
const Product = require('../models/product');

router.get('/', async (req, res) => {
    try {
        console.log('Fetching categories...');

        const categories = await Category.find({});
        return sendSuccess(res, categories, 'Categories fetched successfully', 200);
    } catch (e) {
        return sendError(res, { error: `Error in fetching categories: ${e.message}` }, 500);
    }
});

router.get('/tree', async (req, res) => {
    try {
        const categories = await Category.find({});
        const tree = buildCategoryTree(categories);
        return sendSuccess(res, tree, 'Category tree fetched successfully', 200);
    } catch (err) {
        return sendError(res, { error: `Error in fetching category tree: ${err.message}` }, 500);
    }
});

router.get('/home-categories', async (req, res) => {
    try {
        const parentCategories = await Category.find({ parent: null });

        // Sử dụng Promise.all để xử lý song song
        const result = await Promise.all(
            parentCategories.map(async (parent) => {
                const subcategories = await Category.find({ parent: parent._id });

                const subWithProducts = await Promise.all(
                    subcategories.map(async (sub) => {
                        const products = await Product.find({ category: sub._id })
                            .limit(10)
                            .populate({ path: 'category', populate: 'parent' }).populate({
                                path: 'ratings',
                                model: 'Rating',
                                populate: {
                                    path: 'userId',
                                    model: 'User',
                                    select: 'name email avatar'
                                }
                            });
                        return {
                            name: sub.name,
                            slug: sub.slug,
                            products,
                        };
                    })
                );

                return {
                    name: parent.name,
                    slug: parent.slug,
                    subcategories: subWithProducts,
                };
            })
        );

        return sendSuccess(res, result, 'Home categories and products fetched successfully', 200);
    } catch (err) {
        return sendError(res, { error: `Error in fetching home data: ${err.message}` }, 500);
    }
});



module.exports = router;