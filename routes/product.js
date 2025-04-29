const express = require('express');
const productRouter = express.Router();
const Product = require('../models/product');
const authenticateToken = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const Category = require('../models/category');
const User = require('../models/user');

productRouter.get('/', async (req, res) => {
	try {
		let query = {};

		// Lọc theo category nếu có
		if (req.query?.category) {
			const category = await Category.findOne({ slug: req.query.category });
			if (!category) {
				return sendError(res, { error: 'Category not found' }, 404);
			}
			query.category = category._id;
		}

		// Paging: page & limit
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 9;
		const skip = (page - 1) * limit;

		const [products, total] = await Promise.all([
			Product.find(query)
				.populate({ path: 'category', populate: 'parent' })
				.populate({
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				})
				.skip(skip)
				.limit(limit),
			Product.countDocuments(query)
		]);

		return sendSuccess(
			res,
			{
				data: products,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				totalRecords: total,
			},
			'Products fetched successfully',
			200
		);
	} catch (e) {
		return sendError(res, { error: `Error in fetching products: ${e.message}` }, 500);
	}
});

productRouter.get('/search', async (req, res) => {
	try {
		const { q: query } = req.query;

		// add search history (Chỉ lưu nếu có người dùng đã đăng nhập)
		if (req.user) {
			// Tìm người dùng trong cơ sở dữ liệu
			let user = await User.findById(req.user);
			if (!user) {
				return sendError(res, { error: 'User not found' }, 404);
			}

			// Thêm query vào lịch sử tìm kiếm của người dùng
			user.searchHistory.push(query);
			await user.save();
		}

		// Dùng aggregation để tìm kiếm sản phẩm theo query
		const products = await Product.aggregate([
			// Join với collection Category
			{
				$lookup: {
					from: 'categories', // Tên collection trong MongoDB
					localField: 'category',
					foreignField: '_id',
					as: 'category',
				}
			},
			// category là mảng sau khi $lookup, nên lấy phần tử đầu tiên
			{ $unwind: '$category' },

			// Lọc theo tên, brandName hoặc category.name
			{
				$match: {
					$or: [
						{ name: { $regex: query, $options: 'i' } },
						{ brandName: { $regex: query, $options: 'i' } },
						{ 'category.name': { $regex: query, $options: 'i' } }
					]
				}
			},
			// Populate thông tin parent trong category
			{
				$lookup: {
					from: 'categories',
					localField: 'category.parent',
					foreignField: '_id',
					as: 'category.parent',
				}
			},
			// Nếu category có parent thì lấy thông tin của parent
			{ $unwind: { path: '$category.parent', preserveNullAndEmptyArrays: true } }
		]);

		// Populate ratings (vẫn giữ như cũ)
		await Product.populate(products, [
			{
				path: 'ratings',
				model: 'Rating',
				populate: {
					path: 'userId',
					model: 'User',
					select: 'name email avatar'
				}
			}
		]);

		// Trả về kết quả tìm kiếm
		return sendSuccess(res, products, 'Products fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching products: ${e.message}` }, 500);
	}
});


productRouter.get('/:productId', async (req, res) => {
	try {
		const { productId } = req.params;
		const product = await Product.findById(productId).populate({ path: 'category', populate: 'parent' }).populate({
			path: 'ratings',
			model: 'Rating',
			populate: {
				path: 'userId',
				model: 'User',
				select: 'name email avatar'
			}
		});
		if (!product) {
			return sendError(res, 'Product not found', 404);
		}
		return sendSuccess(res, product, 'Product fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching product : ${e.message}` }, 500);
	}
}
);

productRouter.get('/get-similar-products/:category', async (req, res) => {
	try {
		const { category } = req.params;
		const products = await Product.find({ category }).populate({ path: 'category', populate: 'parent' }).populate({
			path: 'ratings',
			model: 'Rating',
			populate: {
				path: 'userId',
				model: 'User',
				select: 'name email avatar'
			}
		});
		return sendSuccess(res, products, 'Similar products fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching similar products : ${e.message}` }, 500);
	}
});

// create a get request to search products and get them
// /api/products/search/i
productRouter.get('/search/:name', async (req, res) => {
	try {
		const products = await Product.find({
			name: { $regex: req.params.name, $options: 'i' },
		}).populate({ path: 'category', populate: 'parent' }).populate({
			path: 'ratings',
			model: 'Rating',
			populate: {
				path: 'userId',
				model: 'User',
				select: 'name email avatar'
			}
		});

		return sendSuccess(res, products, 'Products fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in searching products : ${e.message}` }, 500);
	}
});


// get request for deal-of-the-day
productRouter.get('/deals-of-the-day', async (req, res) => {
	try {
		let products = await Product.find({}).populate({ path: 'category', populate: 'parent' }).populate({
			path: 'ratings',
			model: 'Rating',
			populate: {
				path: 'userId',
				model: 'User',
				select: 'name email avatar'
			}
		});
		products = products.sort((a, b) => {
			let aSum = 0;
			let bSum = 0;

			for (let i = 0; i < a.ratings.length; i++) {
				aSum += a.ratings[i].rating;
			}

			for (let i = 0; i < b.ratings.length; i++) {
				bSum += b.ratings[i].rating;
			}
			return aSum < bSum ? 1 : -1;
		});

		return sendSuccess(res, products[0], 'Deal of the day fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching deal of the day : ${e.message}` }, 500);
	}
});

// get all Products available
productRouter.get('/names', async (req, res) => {
	try {
		const products = await Product.find({});
		let productNames = [];
		// return products to client
		for (let i = 0; i < products.length; i++) {
			productNames[i] = products[i].name;
		}
		return sendSuccess(res, productNames, 'Products fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching products : ${e.message}` }, 500);
	}
});

productRouter.get('/user-ratings/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;

		// Find the product and populate the ratings with user information
		const product = await Product.findById(productId)
			.populate({
				path: 'ratings',
				populate: {
					path: 'userId',
					model: 'User',
					select: 'name email avatar'
				}
			});

		if (!product) {
			return sendError(res, 'Product not found', 404);
		}

		// Extract users from ratings
		const users = product.ratings.map(rating => rating.userId);

		return sendSuccess(res, users, 'Users who rated the product fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching users who rated : ${e.message}` }, 500);
	}
});

module.exports = productRouter;
