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
        // Lấy các category cha
        const parentCategories = await Category.find({ parent: null });

        const result = [];

        for (const parent of parentCategories) {
            // Tìm các subcategory của từng parent
            const subcategories = await Category.find({ parent: parent._id });

            const subWithProducts = [];

            for (const sub of subcategories) {
                const products = await Product.find({ category: sub._id }).limit(10); // giới hạn sản phẩm nếu muốn
                subWithProducts.push({
                    name: sub.name,
                    slug: sub.slug,
                    products
                });
            }

            result.push({
                name: parent.name,
                slug: parent.slug,
                subcategories: subWithProducts
            });
        }

        return sendSuccess(res, result, 'Home categories and products fetched successfully', 200);
    } catch (err) {
        return sendError(res, { error: `Error in fetching home data: ${err.message}` }, 500);
    }
});


module.exports = router;