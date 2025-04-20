const express = require('express');
const adminRouter = express.Router();
const admin = require('../middlewares/admin');
const Product = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// Create a new product
adminRouter.post('/add-product', admin, async (req, res) => {
	try {

		if (!req.files || req.files.length === 0) {
			return sendError(res, 'Please upload at least one image', 400);
		}

		try {
			// Upload images to Cloudinary
			const uploadPromises = req.files.map(async file => {
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

			const {
				name,
				description,
				brandName,
				quantity,
				price,
				category,
			} = req.body;

			const product = new Product({
				name,
				description,
				brandName,
				images,
				quantity,
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
adminRouter.put('/update-product', admin, async (req, res) => {
	try {
		const {
			id,
			name,
			description,
			brandName,
			images,
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
			for (const imageUrl of imagesToDelete) {
				try {

					const publicId = await cloudinary.uploader.destroy(
						publicIdWithoutExtension,
					);
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
		if (images) {
			product.images = images;
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

adminRouter.get('/get-products', admin, async (req, res) => {
	try {
		const products = await Product.find({});
		// return products to client

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
adminRouter.post('/delete-product', admin, async (req, res) => {
	try {
		const { id } = req.body;

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
				// Continue with other images even if one fails
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
adminRouter.post('/change-order-status', admin, async (req, res) => {
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
adminRouter.get('/get-orders', admin, async (req, res) => {
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
		const orders = await Order.find({});
		let totalEarnings = 0;

		for (let i = 0; i < orders.length; i++) {
			for (let j = 0; j < orders[i].products.length; j++) {
				totalEarnings +=
					orders[i].products[j].quantity * orders[i].products[j].product.price;
			}
		}

		// Category wise order fetching
		let mobileEarnings = await fetchCategoryWiseProducts('Mobiles');
		let essentialsEarnings = await fetchCategoryWiseProducts('Essentials');
		let appliancesEarnings = await fetchCategoryWiseProducts('Appliances');
		let booksEarnings = await fetchCategoryWiseProducts('Books');
		let fashionEarnings = await fetchCategoryWiseProducts('Fashion');

		let earnings = {
			totalEarnings,
			mobileEarnings,
			essentialsEarnings,
			appliancesEarnings,
			booksEarnings,
			fashionEarnings,
		};

		return sendSuccess(
			res,
			earnings,
			'Analytics fetched successfully',
			200,
		);
	} catch (e) {
		return sendError(
			res,
			{ error: `Error in fetching analytics : ${e.message}` },
			500,
		);
	}
});

async function fetchCategoryWiseProducts(category) {
	let earnings = 0;
	let categoryOrders = await Order.find({
		'products.product.category': category,
	});

	for (let i = 0; i < categoryOrders.length; i++) {
		for (let j = 0; j < categoryOrders[i].products.length; j++) {
			earnings +=
				categoryOrders[i].products[j].quantity *
				categoryOrders[i].products[j].product.price;
		}
	}
	return earnings;
}

// do not forget to export adminRouter!
module.exports = adminRouter;
