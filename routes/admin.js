const express = require('express');
const adminRouter = express.Router();
const admin = require('../middlewares/admin');
const Product = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const upload = require('../middlewares/upload');
const streamifier = require('streamifier');


// Create a new product
adminRouter.post('/product/add', admin, upload.array('images', 10), async (req, res) => {
	try {

		if (!req.files || req.files.length === 0) {
			return sendError(res, 'Please upload at least one image', 400);
		}

		const {
			name,
			description,
			brandName,
			stock,
			price,
			category,
		} = req.body;

		try {
			const results = [];
			const folderProductName = name.trim().toLowerCase().replace(/\s+/g, '-');

			for (const file of req.files) {
				const result = await new Promise((resolve, reject) => {
					const stream = cloudinary.uploader.upload_stream(
						{ folder: `eshop/products/${folderProductName}` },
						(err, result) => err ? reject(err) : resolve(result)
					);
					streamifier.createReadStream(file.buffer).pipe(stream);
				});

				results.push({ originalName: file.originalname, public_id: result.public_id, url: result.secure_url });
			}

			// Transform Cloudinary results to image data
			const images = results.map(result => ({
				public_id: result.public_id,
				url: result.url,
			}));

			console.log(`images: ${JSON.stringify(images)}`);
			

			const product = new Product({
				name,
				description,
				brandName,
				images,
				stock,
				price,
				category,
			});

			await product.save();

			return sendSuccess(
				res,
				product,
				'Product created successfully',
				201,
			);
		} catch (error) {
			return sendError(
				res,
				{ error: `Error in uploading images : ${error.message}` },
				500,
			);

		}
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in creating product : ${e.message}` },
			500,
		);
	}
});

// update product
adminRouter.put('/product/update', admin, async (req, res) => {
	try {
		const {
			id,
			name,
			description,
			brandName,
			newImages,
			quantity,
			price,
			category,
			imagesToDelete,
		} = req.body;

		// Find the product first
		const product = await Product.findById(id);
		if (!product) {
			return sendError(res, 'Product not found', 404);
		}

		// Delete old images from Cloudinary if any
		if (imagesToDelete && imagesToDelete.length > 0) {
			for (const image of imagesToDelete) {
				try {
					const { public_id } = image;
					await cloudinary.uploader.destroy(public_id);
					product.images = product.images.filter(
						image => image.public_id !== public_id,
					)
				} catch (error) {
					return sendError(
						res,
						{ error: `Error in deleting image : ${error.message}` },
						500,
					);
				}
			}
		}

		// Update the product fields
		if (name) {
			product.name = name;
		}
		if (description) {
			product.description = description;
		}
		if (brandName) {
			product.brandName = brandName;
		}
		if (newImages && newImages.length > 0) {
			// Upload new images to Cloudinary
			try {
				const uploadPromises = newImages.map(async file => {
					const b64 = Buffer.from(file.buffer).toString('base64');
					const dataURI = 'data:' + file.mimetype + ';base64,' + b64;

					return cloudinary.uploader.upload(dataURI, {
						folder: 'motbook/products',
						resource_type: 'auto',
						transformation: [
							{ width: 800, crop: 'scale' },
							{ quality: 'auto' },
						],
					});
				});

				const results = await Promise.all(uploadPromises);

				// Transform Cloudinary results to image data
				const images = results.map(result => ({
					url: result.secure_url,
					public_id: result.public_id,
				}));

				product.images = [...product.images, ...images];
			} catch (error) {
				return sendError(
					res,
					{ error: `Error in uploading images : ${error.message}` },
					500,
				);
			}
		}
		if (quantity) {
			product.quantity = quantity;
		}
		if (price) {
			product.price = price;
		}
		if (category) {
			product.category = category;
		}

		// Save the updated product
		const updatedProduct = await product.save();
		return sendSuccess(
			res,
			updatedProduct,
			'Product updated successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in updating product : ${e.message}` },
			500,
		);
	}
});

// get all products
// api /admin/get-products

adminRouter.get('/products', admin, async (req, res) => {
	try {
		const products = await Product.find({});

		return sendSuccess(
			res,
			products,
			'Products fetched successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in fetching products : ${e.message}` },
			500,
		);
	}
});

// delete product
adminRouter.post('/product/delete/:id', admin, async (req, res) => {
	try {
		const { id } = req.params;

		// Get the product first to ensure it exists
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ error: 'Product not found' });
		}

		// Delete images from Cloudinary
		// Get all images from the product
		const { images } = product;
		for (const image of images) {
			try {
				const { public_id } = image;

				await cloudinary.api.delete_resources_by_prefix(public_id);
				await cloudinary.api.delete_folder(public_id);
			} catch (error) {
				console.error(`Error deleting image ${image}:`, error);
				return sendError(
					res,
					{ error: `Error in deleting image : ${error.message}` },
					500,
				);
			}
		}

		// Delete the product from database
		await Product.findByIdAndDelete(id);

		return sendSuccess(
			res,
			{},
			'Product deleted successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in deleting product : ${e.message}` },
			500,
		);
	}
});

// change status
adminRouter.post('/orders/change-status', admin, async (req, res) => {
	try {
		const { orderId, status } = req.body;

		let order = await Order.findById(orderId);
		order.status = status;
		order = await order.save();
		return sendSuccess(
			res,
			order,
			'Order status changed successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in changing order status : ${e.message}` },
			500,
		);
	}
});

//
adminRouter.get('/orders', admin, async (req, res) => {
	try {
		const orders = await Order.find({});
		return sendSuccess(
			res,
			orders,
			'Orders fetched successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in fetching orders : ${e.message}` },
			500,
		);
	}
});

// get order details and sales analysis

adminRouter.get('/analytics', admin, async (req, res) => {
	try {
		const orders = await Order.find({})
			.populate({
				path: 'products.product',
				populate: {
					path: 'category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				}
			});

		let totalEarnings = 0;
		let categoryEarnings = {};
		let parentCategoryEarnings = {};
		let categoryTreeEarnings = {};
		let monthlyEarnings = {};
		let orderStatusStats = {};
		let productSales = {};

		orders.forEach(order => {
			const orderMonth = new Date(order.createdAt).toLocaleString('en-US', {
				month: 'long',
				year: 'numeric'
			});

			// Thống kê đơn hàng theo trạng thái
			orderStatusStats[order.status] = (orderStatusStats[order.status] || 0) + 1;

			order.products.forEach(item => {
				const product = item.product;
				const category = product.category;
				const parent = category?.parent;
				const quantity = item.quantity;
				const earnings = quantity * product.price;

				totalEarnings += earnings;

				// === Doanh thu theo danh mục nhỏ ===
				const categoryName = category?.name || 'Unknown';
				categoryEarnings[categoryName] = (categoryEarnings[categoryName] || 0) + earnings;

				// === Doanh thu theo danh mục lớn (parent) ===
				const parentCategoryName = parent?.name || categoryName;
				parentCategoryEarnings[parentCategoryName] = (parentCategoryEarnings[parentCategoryName] || 0) + earnings;

				// === Dạng cây phân cấp ===
				if (!categoryTreeEarnings[parentCategoryName]) {
					categoryTreeEarnings[parentCategoryName] = {
						totalEarnings: 0,
						subcategories: {}
					};
				}

				categoryTreeEarnings[parentCategoryName].totalEarnings += earnings;

				if (parentCategoryName !== categoryName) {
					categoryTreeEarnings[parentCategoryName].subcategories[categoryName] =
						(categoryTreeEarnings[parentCategoryName].subcategories[categoryName] || 0) + earnings;
				}

				// === Doanh thu theo tháng ===
				monthlyEarnings[orderMonth] = (monthlyEarnings[orderMonth] || 0) + earnings;

				// === Top sản phẩm bán chạy ===
				const key = product._id.toString();
				productSales[key] = productSales[key] || {
					productId: product._id,
					name: product.name,
					totalSold: 0
				};
				productSales[key].totalSold += quantity;
			});
		});

		const topSellingProducts = Object.values(productSales)
			.sort((a, b) => b.totalSold - a.totalSold)
			.slice(0, 5);

		return sendSuccess(
			res,
			{
				totalEarnings,
				categoryEarnings,
				parentCategoryEarnings,
				categoryTreeEarnings,
				monthlyEarnings,
				orderStatusStats,
				topSellingProducts
			},
			'Analytics fetched successfully',
			200
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in fetching analytics: ${e.message}` },
			500
		);
	}
});


module.exports = adminRouter;
