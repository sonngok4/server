const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const authenticateToken = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { buildCategoryTree } = require('../utils/categoryUtils');

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

module.exports = router;