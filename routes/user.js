const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');
const authenticateToken = require('../middlewares/auth');
const { sendError, sendSuccess } = require('../utils/responseUtils');

//Get user data
userRouter.get('/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-password');
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
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		return sendSuccess(res, user, 'User data fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting user data: ${error.message}` }, 500);
	}
});

userRouter.post('/profile', authenticateToken, async (req, res) => {
	try {
		const { name, address, phone } = req.body;
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		user.name = name;
		user.address = address;
		user.phone = phone;

		await user.save();
		return sendSuccess(res, user, 'User data fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting user data: ${error.message}` }, 500);
	}
});

// get cart
userRouter.get('/cart/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		return sendSuccess(res, user, 'Cart fetched successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in getting cart: ${error.message}` }, 500);
	}
});

// update cart
// if product is already in cart, update quantity
// if product is not in cart, add it
// if quantity is 0, remove it
userRouter.post('/cart/:productId', authenticateToken, async (req, res) => {
	try {
		const { productId } = req.params;
		const { quantity } = req.body;
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}
		const product = await Product.findById(productId);
		if (!product) {
			return sendError(res, 'Product not found', 404);
		}
		if (quantity === 0) {
			user.cart.pull(productId);
		} else {
			user.cart.push({ product: productId, quantity });
		}
		await user.save();
		return sendSuccess(res, user, 'Cart updated successfully', 200);
	} catch (error) {
		return sendError(res, { error: `Error in updating cart: ${error.message}` }, 500);
	}
})
// getting wishList
userRouter.get('/wishlist', authenticateToken, async (req, res) => {
	try {
		let user = User.findById(req.user);
		return sendSuccess(res, user, 'WishList fetched successfully', 200);
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
		let {wishList} = user;
		let isProductFound = false;

		for (let i = 0; i < wishList.length; i++) {
			if (wishList[i].equals(productId)) {
				isProductFound = true;
			}
		}

		if (isProductFound) {
			wishList = wishList.filter(item => !item.equals(productId));
		} else {
			wishList.push(productId);
		}

		user.wishList = wishList;
		user = await user.save();
		return sendSuccess(res, user, 'WishList updated successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in updating wishList : ${e.message}` }, 500);
	}
});

// add profile picture
userRouter.post('/profile/picture', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user);
		if (!user) {
			return sendError(res, 'User not found', 404);
		}

		// Check if image file exists in request
		if (!req.files || !req.files.image) {
			return sendError(res, 'No image file provided', 400);
		}

		const file = req.files.image;

		// Delete old image from cloudinary if exists
		if (user.avatar && user.avatar[0] && user.avatar[0].public_id) {
			await cloudinary.uploader.destroy(user.avatar[0].public_id);
		}

		// Upload new image to cloudinary
		const result = await cloudinary.uploader.upload(file.tempFilePath, {
			folder: 'eshop/userAvatar',
			width: 150,
			crop: "scale"
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
		let user = await User.findById(req.user);
		user.address = address;
		user = await user.save();
		return sendSuccess(res, user, 'Address saved successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in saving address : ${e.message}` }, 500);
	}
});

// order product

userRouter.post('/place-order', authenticateToken, async (req, res) => {
	try {
		// const { id } = req.body;
		const { orderRequest, totalAmount } = req.body;
		const { orderItems, shippingAddress, paymentMethod, note } = orderRequest;
		// orderItems = [{ product, quantity }]
		const products = [];
		for (let i = 0; i < orderItems.length; i++) {
			const product = await Product.findById(orderItems[i].product._id);
			console.log('====> Product:', product);

			if (!product) {
				return sendError(res, 'Product not found', 404);
			}
			products.push({
				product: product,
				quantity: orderItems[i].quantity,
				totalPrice: product.price * orderItems[i].quantity,
			});
		}
		let user = await User.findById(req.user);
		let order = new Order({
			user,
			products,
			totalAmount,
			shippingAddress,
			paymentMethod,
			note,
			status: 'Pending',
		});
		order = await order.save();
		return sendSuccess(res, order, 'Order placed successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in placing order : ${e.message}` }, 500);
	}
});

// getting all orders

userRouter.get('/orders/me', authenticateToken, async (req, res) => {
	try {
		// const { id } = req.body;
		let orders = await Order.find({ userId: req.user });
		return sendSuccess(res, orders, 'Orders fetched successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in fetching orders : ${e.message}` }, 500);
	}
});

// search history

userRouter.post('/search-history/add', authenticateToken, async (req, res) => {
	try {
		const { searchQuery } = req.body;

		let user = await User.findById(req.user);
		user.searchHistory.push(searchQuery.trim());

		// user.searchHistory[] = searchQuery;

		user = await user.save();
		return sendSuccess(res, user, 'Search query added successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in adding search query : ${e.message}` }, 500);
	}
});

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
		let user = await User.findById(req.user);

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
		let user = await User.findById(req.user);
		user.searchHistory = [];

		//updating the user info
		user = await user.save();
		return sendSuccess(res, user, 'Search history cleared successfully', 200);
	} catch (e) {
		return sendError(res, { error: `Error in clearing search history : ${e.message}` }, 500);
	}
});


userRouter.put('/shipping-address', authenticateToken, async (req, res) => {
	try {
		const { name, phone, address } = req.body;
		let user = await User.findById(req.user);

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
