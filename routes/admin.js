const express = require('express');
const adminRouter = express.Router();
const admin = require('../middlewares/admin');
const { Product } = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');
// adding product
// you can add all the middlewares here just add them by commas in post method
adminRouter.post('/add-product', admin, async (req, res) => {
	try {
		const {
			name,
			description,
			brandName,
			images,
			quantity,
			price,
			category,
		} = req.body;

		// using let so that it can be changed later
		let product = new Product({
			name,
			description,
			brandName,
			images,
			quantity,
			price,
			category,
		});

		//saving to the DB
		product = await product.save();
		res.json(product);
	} catch (e) {
		return res.status(500).json({ error: e.message });
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
			return res.status(404).json({ error: 'Product not found' });
		}

		// Delete old images from Cloudinary if any
		if (imagesToDelete && imagesToDelete.length > 0) {
			for (const imageUrl of imagesToDelete) {
				try {
					// Extract public_id from URL
					const uri = new URL(imageUrl);
					const pathSegments = uri.pathname.split('/');
					const eshopIndex = pathSegments.findIndex(
						segment => segment === 'eshop',
					);

					if (eshopIndex !== -1) {
						const publicId = pathSegments.slice(eshopIndex).join('/');
						const publicIdWithoutExtension = publicId.substring(
							0,
							publicId.lastIndexOf('.'),
						);
						await cloudinary.uploader.destroy(publicIdWithoutExtension);
					}
				} catch (error) {
					console.error(`Error deleting image ${imageUrl}:`, error);
					// Continue with other images even if one fails
				}
			}
		}

		// Update the product fields
		if (name) product.name = name;
		if (description) product.description = description;
		if (brandName) product.brandName = brandName;
		if (images) product.images = images;
		if (quantity) product.quantity = quantity;
		if (price) product.price = price;
		if (category) product.category = category;

		// Save the updated product
		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

// get all products
// api /admin/get-products

adminRouter.get('/get-products', admin, async (req, res) => {
	try {
		const products = await Product.find({});
		// return products to client

		res.json(products);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// delete product
adminRouter.post('/delete-product', admin, async (req, res) => {
	try {
		const { id, imageUrls } = req.body;

		// Get the product first to ensure it exists
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ error: 'Product not found' });
		}

		// Delete images from Cloudinary
		if (imageUrls && imageUrls.length > 0) {
			for (const imageUrl of imageUrls) {
				try {
					// Extract public_id from URL
					const uri = new URL(imageUrl);
					const pathSegments = uri.pathname.split('/');
					const eshopIndex = pathSegments.findIndex(
						segment => segment === 'eshop',
					);

					if (eshopIndex !== -1) {
						const publicId = pathSegments.slice(eshopIndex).join('/');
						const publicIdWithoutExtension = publicId.substring(
							0,
							publicId.lastIndexOf('.'),
						);
						await cloudinary.uploader.destroy(publicIdWithoutExtension);
					}
				} catch (error) {
					console.error(`Error deleting image ${imageUrl}:`, error);
					// Continue with other images even if one fails
				}
			}
		}

		// Delete the product from database
		await Product.findByIdAndDelete(id);

		res.json({ message: 'Product deleted successfully' });
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

// change status
adminRouter.post('/change-order-status', admin, async (req, res) => {
	try {
		const { id, status } = req.body;

		let order = await Order.findById(id);
		order.status = status;
		order = await order.save();
		// no need to save it will be done by findByIdAndDelete()
		// product = await product.save();
		res.json(order);
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

//
adminRouter.get('/get-orders', admin, async (req, res) => {
	try {
		const orders = await Order.find({});
		res.json(orders);
	} catch (e) {
		res.status(500).json({ error: e.message });
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

		res.json(earnings);
	} catch (e) {
		res.status(500).json({
			error: `Analytics get request error : ${e.message}`,
		});
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
