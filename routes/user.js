const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');
const streamifier = require('streamifier');
const authenticateToken = require('../middlewares/auth');
const { sendError, sendSuccess } = require('../utils/responseUtils');
const upload = require('../middlewares/upload');

//Get user data
userRouter.get('/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-password -__v -cart -orders -wishlist');
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		return sendSuccess(res, user, 'User data fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting user data: ${error.message}` }, 500);
	}
});

userRouter.get('/profile', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-__v -cart -orders -wishlist');;
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		return sendSuccess(res, user, 'User data fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting user data: ${error.message}` }, 500);
	}
});

userRouter.patch('/profile', authenticateToken, async (req, res) => {
	try {
		const { name, address, phone } = req.body;
		const user = await User.findById(req.user).select('-__v -cart -orders -wishlist');

		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		// Chỉ cập nhật nếu field đó được gửi lên
		if (name !== undefined) {
			user.name = name;
		}
		if (address !== undefined) {
			user.address = address;
		}
		if (phone !== undefined) {
			user.phone = phone;
		}

		await user.save();
		return sendSuccess(res, user, 'User profile updated successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error updating user profile: ${error.message}` }, 500);
	}
});


// add profile picture
userRouter.post('/profile/picture', authenticateToken, upload.single('image'), async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-__v -cart -orders -wishlist');
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		console.log(`req`, req.file);


		// Check if image file exists in request
		if (!req.file) {
			return sendError(res, 'No image file provided', 400);
		}

		// Delete old image from cloudinary if exists
		if (user.avatar && user.avatar[0] && user.avatar[0].public_id) {
			await cloudinary.uploader.destroy(user.avatar[0].public_id);
		}

		// Upload new image to cloudinary
		const result = await new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder: `eshop/users/${user._id}` },
				(err, result) => err ? reject(err) : resolve(result)
			);
			streamifier.createReadStream(req.file.buffer).pipe(stream);
		});

		// Update user avatar
		user.avatar = [{
			public_id: result.public_id,
			url: result.secure_url
		}];

		await user.save();

		return sendSuccess(res, user, 'Profile picture updated successfully', 200);

	} catch (e) {
		return sendError(res, { error: `Error in adding profile picture : ${e.message}` }, 500);
	}
});


// save user address

userRouter.post('/address/save', authenticateToken, async (req, res) => {
	try {
		const { address } = req.body;
		let user = await User.findById(req.user).select('-__v -cart -orders -wishlist');
		user.address = address;
		user = await user.save();
		return sendSuccess(res, user, 'Address saved successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in saving address : ${e.message}` }, 500);
	}
});


// get cart
userRouter.get('/cart/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user).populate({
			path: 'cart.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		const { cart } = user;
		return sendSuccess(res, cart, 'Cart fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting cart: ${error.message}` }, 500);
	}
});

// Add product to cart
userRouter.post('/cart/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;
		const { quantity } = req.body;
		if (quantity <= 0) {
			return sendError(res, 'Quantity must be greater than 0', 400);
		}

		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		const product = await Product.findById(productId);
		if (!product) {
			return sendError(res, 'Product not found', 404);
		}

		const existingItem = user.cart.find(item => item.product.toString() === productId);
		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			user.cart.push({ product: productId, quantity });
		}

		await user.save();
		let userSaved = await User.findById(req.user).select('-password -__v -orders -wishlist').populate({
			path: 'cart.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		const { cart } = userSaved;
		return sendSuccess(res, cart, 'Product added to cart', 200);
	} catch (error) {
		return sendError(res, { error: `Error adding to cart: ${error.message}` }, 500);
	}
});


// Update quantity of product in cart
userRouter.put('/cart/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;
		const { quantity } = req.body;
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		const item = user.cart.find(item => item.product.toString() === productId);
		if (!item) {
			return sendError(res, 'Product not in cart', 404);
		}

		if (quantity <= 0) {
			user.cart.pull(item);
		} else {
			item.quantity = quantity;
		}

		await user.save();
		const userSaved = await User.findById(req.user).select('-password -__v -orders -wishlist').populate({
			path: 'cart.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		const { cart } = userSaved;
		return sendSuccess(res, cart, 'Cart updated successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error updating cart: ${error.message}` }, 500);
	}
});


// Delete product from cart
userRouter.delete('/cart/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		user.cart = user.cart.filter(item => item.product.toString() !== productId);

		await user.save();
		const userSaved = await User.findById(req.user).select('-password -__v -orders -wishlist').populate({
			path: 'cart.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		const { cart } = userSaved;
		return sendSuccess(res, cart, 'Product removed from cart', 200);
	} catch (error) {
		return sendError(res, { error: `Error removing product: ${error.message}` }, 500);
	}
});

// clear all products from cart
userRouter.delete('/cart/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		user.cart = [];
		await user.save();
		const userSaved = await User.findById(req.user).select('-password -__v -orders -wishlist').populate({
			path: 'cart.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		const { cart } = userSaved;
		return sendSuccess(res, cart, 'Cart cleared successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error clearing cart: ${error.message}` }, 500);
	}
});



// getting wishList
userRouter.get('/wishlist', authenticateToken, async (req, res) => {
	try {
		let user = User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		const { wishlist } = user;
		return sendSuccess(res, wishlist, 'WishList fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching wishList : ${e.message}` }, 500);
	}
});
// toggle wishlist
// if product is already in wishlist, remove it
// if product is not in wishlist, add it
userRouter.post('/wishlist/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;
		let user = await User.findById(req.user);
		let { wishlist } = user;
		let isProductFound = false;

		for (let i = 0; i < wishlist.length; i++) {
			if (wishlist[i].equals(productId)) {
				isProductFound = true;
			}
		}

		if (isProductFound) {
			wishlist = wishlist.filter(item => !item.equals(productId));
		} else {
			wishlist.push(productId);
		}

		user.wishList = wishlist;
		user = await user.save();
		return sendSuccess(res, wishlist, 'WishList updated successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in updating wishList : ${e.message}` }, 500);
	}
});



// order product
userRouter.post('/place-order', authenticateToken, async (req, res) => {
	try {
		const { products, shippingAddress, paymentMethod, note } = req.body;

		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		let orderProducts = [];
		let totalAmount = 0;

		for (const item of products) {
			const productData = await Product.findById(item.product);
			if (!productData) {
				return sendError(res, `Product not found: ${item.product}`, 404);
			}

			const { quantity } = item;
			productData.stock -= quantity;
			await productData.save();
			const totalPrice = productData.price * quantity;

			orderProducts.push({
				product: productData._id,
				quantity,
				totalPrice
			});

			totalAmount += totalPrice;
		}

		const order = await Order.create({
			user: user._id,
			products: orderProducts,
			totalAmount,
			shippingAddress,
			paymentMethod,
			note
		});

		user.orders.push(order);
		await user.save();
		const ordered = await Order.findById(order._id).populate({
			path: 'products.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		return sendSuccess(res, { order: ordered }, 'Order placed successfully', 201);
	} catch (e) {
		return sendError(res, { error: `Error in placing order : ${e.message}` }, 500);
	}
});


// getting all orders
userRouter.get('/orders/me', authenticateToken, async (req, res) => {
	try {
		// const { id } = req.body;
		let orders = await Order.find({ user: req.user }).populate({
			path: 'products.product',
			populate: [
				{
					path: 'category',
					model: 'Category',
					populate: {
						path: 'parent',
						model: 'Category'
					}
				},
				{
					path: 'ratings',
					model: 'Rating',
					populate: {
						path: 'userId',
						model: 'User',
						select: 'name email avatar'
					}
				}
			]
		});
		if (!orders) {
			return sendError(res, 'Orders not found', 404);
		}
		return sendSuccess(res, orders, 'Orders fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching orders : ${e.message}` }, 500);
	}
});

// search history
// add search history
userRouter.post('/search-history/add', authenticateToken, async (req, res) => {
	try {
		const { searchQuery } = req.body;

		let user = await User.findById(req.user).select('-__v -cart -orders -wishlist');
		user.searchHistory.push(searchQuery.trim());

		// user.searchHistory[] = searchQuery;

		user = await user.save();
		return sendSuccess(res, user, 'Search query added successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in adding search query : ${e.message}` }, 500);
	}
});

// get search history
userRouter.get('/search-history', authenticateToken, async (req, res) => {
	try {
		let user = await User.findById(req.user);
		let searchHistory = [];

		for (let i = 0; i < user.searchHistory.length; i++) {
			searchHistory[i] = user.searchHistory[i];
		}

		return sendSuccess(res, searchHistory, 'Search history fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching search history : ${e.message}` }, 500);
	}
});


// remove search history item
userRouter.delete('/search-history/delete', authenticateToken, async (req, res) => {
	try {
		const { deleteQuery } = req.body;
		let user = await User.findById(req.user).select('-__v -cart -orders -wishlist');

		const index = user.searchHistory.indexOf(deleteQuery);

		user.searchHistory.splice(index, 1);

		//updating the user info
		user = await user.save();
		return sendSuccess(res, user, 'Search history item deleted successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in deleting search history item : ${e.message}` }, 500);
	}
});

// Clear all search history
userRouter.delete('/search-history/clear', authenticateToken, async (req, res) => {
	try {
		let user = await User.findById(req.user).select('-__v -cart -orders -wishlist');
		user.searchHistory = [];

		//updating the user info
		user = await user.save();
		return sendSuccess(res, user, 'Search history cleared successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in clearing search history : ${e.message}` }, 500);
	}
});


// update shipping address
userRouter.put('/shipping-address', authenticateToken, async (req, res) => {
	try {
		const { name, phone, address } = req.body;
		let user = await User.findById(req.user).select('-__v -cart -orders -wishlist');

		if (name) {
			user.name = name;
		}
		if (phone) {
			user.phone = phone;
		}
		if (address) {
			user.address = address;
		}

		user = await user.save();
		return sendSuccess(res, user, 'Profile updated successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error updating profile: ${e.message}` }, 500);
	}
});

module.exports = userRouter;
