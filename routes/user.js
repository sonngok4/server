const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const auth = require('../middlewares/auth');
const { Product } = require('../models/product');
const Order = require('../models/order');
const cloudinary = require('../configs/cloudinary');

//Get user data
userRouter.get('/me', auth, async (req, res) => {
	const user = await User.findById(req.user);

	res.json({ ...user._doc, token: req.token });
});

// add item to cart
userRouter.post('/add-to-cart', auth, async (req, res) => {
	try {
		const { id } = req.body;
		const product = await Product.findById(id);
		//req.user is the user id provided by mongoDB
		let user = await User.findById(req.user);

		// if cart is empty push the product in "cart" array of user
		// and update the quatity as 1
		if (user.cart.length == 0) {
			console.log('====> User cart length 0: increamenting to 1');
			user.cart.push({ product, quantity: 1 });
		} else {
			console.log('====> User cart length non-zero: increamenting to 1');
			let isProductFound = false;

			for (let i = 0; i < user.cart.length; i++) {
				// if the product's id matches the id of product in cart
				if (user.cart[i].product._id.equals(product._id)) {
					isProductFound = true;
				}
			}

			// if product is already in the cart, increament its quantity by 1
			if (isProductFound) {
				// find the product in the cart, i.e. productFound
				let productFound = user.cart.find(productItem =>
					productItem.product._id.equals(product._id),
				);
				console.log('====> Product found in cart already, increamenting by 1');
				// increament the quantity by 1
				productFound.quantity += 1;
			} else {
				// if not found in the cart [happens when cart.length is NOT 0, and new item is added]
				// add the product for the first time in cart
				// and update quantity as 1
				user.cart.push({ product, quantity: 1 });
			}
		}
		//updating the user info
		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// add item to wishList
userRouter.post('/add-to-wishList', auth, async (req, res) => {
	try {
		const { id } = req.body;
		const product = await Product.findById(id);
		//req.user is the user id provided by mongoDB
		let user = await User.findById(req.user);

		// if cart is empty push the product in "cart" array of user
		// and update the quatity as 1
		if (user.wishList.length == 0) {
			// console.log("====> User wishList length 0: increamenting to 1");
			// product is ID of the product, whereas { product } is the product object
			// dont use this for sending product : user.wishList.push(product);
			user.wishList.push({ product });
		} else {
			// console.log("====> User wishList length non-zero: increamenting to 1");
			let isProductFound = false;

			for (let i = 0; i < user.wishList.length; i++) {
				// if the product's id matches the id of product in cart
				if (user.wishList[i].product._id.equals(product._id)) {
					isProductFound = true;
				}
			}

			// if product is already in the cart, increament its quantity by 1
			if (!isProductFound) {
				user.wishList.push({ product });
			}
		}
		//updating the user info
		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({
			error: `Error in adding to wishList ${e.message}`,
		});
	}
});

// remove item from wish list
userRouter.delete('/remove-from-wishList/:id', auth, async (req, res) => {
	try {
		const { id } = req.params;
		//same thing
		// const { id } = req.params.id ;
		// console.log(`ID is : ${id}`);

		const product = await Product.findById(id);
		//req.user is the user id provided by mongoDB
		let user = await User.findById(req.user);

		for (let i = 0; i < user.wishList.length; i++) {
			// if the product's id matches the id of product in cart
			if (user.wishList[i].product._id.equals(product._id)) {
				// Array.splice(start: number, deleteCount? )
				user.wishList.splice(i, 1);
				break;
			}
		}
		//updating the user info
		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({
			error: `Error in removing from wishList ${e.message}`,
		});
	}
});

// add profile picture
userRouter.post('/add-profile-picture', auth, async (req, res) => {
	try {
		const { image, folder } = req.body;
		let user = await User.findById(req.user);

		// Delete old avatar if exists
		if (user.avatar.length > 0) {
			try {
				const oldAvatar = user.avatar[0];
				const publicId = oldAvatar.public_id;

					await cloudinary.uploader.destroy(publicId);
					console.log(`Deleted old avatar: ${publicId}`);
			} catch (err) {
				console.error('Error deleting old avatar:', err);
			}
		}

		const uploadFolder =
			folder || `eshop/User_Profile_Pictures/${user.email}/${user.name}`;
		const result = await cloudinary.uploader.upload(image, {
			folder: uploadFolder,
			resource_type: 'auto',
		});

		const { secure_url, public_id } = result;

		// Set new avatar
		user.avatar = [
			{
				public_id,
				url: secure_url,
			},
		];

		user = await user.save();

		res.json(user);
	} catch (e) {
		console.error('Error updating profile picture:', e);
		res.status(500).json({ error: e.message });
	}
});


// do not forget to add the colon :  before id in the url
userRouter.delete('/remove-from-cart/:id', auth, async (req, res) => {
	try {
		console.log('inside remove cart function');
		const { id } = req.params;
		//same thing
		// const { id } = req.params.id ;
		console.log(`ID is : ${id}`);

		const product = await Product.findById(id);
		//req.user is the user id provided by mongoDB
		let user = await User.findById(req.user);

		for (let i = 0; i < user.cart.length; i++) {
			// if the product's id matches the id of product in cart
			if (user.cart[i].product._id.equals(product._id)) {
				// Array.splice(start: number, deleteCount? )
				// splice(starIndex, howManytoDelete)
				if (user.cart[i].quantity == 1) {
					user.cart.splice(i, 1);
				} else {
					user.cart[i].quantity -= 1;
				}
			}
		}
		//updating the user info
		user = await user.save();
		res.json(user);
	} catch (e) {
		console.log('inside the catch block of remove from cart');
		res.status(500).json({
			error: `Error in removing product from cart : ${e.message}`,
		});
	}
});

// remove search history item

userRouter.post('/delete-search-history-item', auth, async (req, res) => {
	try {
		const { deleteQuery } = req.body;
		let user = await User.findById(req.user);

		const index = user.searchHistory.indexOf(deleteQuery);

		user.searchHistory.splice(index, 1);

		//updating the user info
		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({
			error: `Error in deleting searchQuery item : ${e.message}`,
		});
	}
});

// save user address

userRouter.post('/save-user-address', auth, async (req, res) => {
	try {
		const { address } = req.body;
		let user = await User.findById(req.user);
		user.address = address;
		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// order product

userRouter.post('/place-order', auth, async (req, res) => {
	try {
		// const { id } = req.body;
		const { cart, totalPrice, address } = req.body;
		let products = [];

		for (let i = 0; i < cart.length; i++) {
			let product = await Product.findById(cart[i].product._id);
			if (product.quantity >= cart[i].quantity) {
				product.quantity -= cart[i].quantity;
				products.push({ product, quantity: cart[i].quantity });
				await product.save();
			} else {
				// 400 Bad Request as product is out of stock
				return res.status(400).json({ msg: `${product.name} is out of stock` });
			}
		}

		let user = await User.findById(req.user);
		// empty the cart after the order is placed
		user.cart = [];
		user = await user.save();

		let order = new Order({
			products,
			totalPrice,
			address,
			userId: req.user,
			orderedAt: new Date().getTime(),
		});

		// save the order in DB
		order = await order.save();
		res.json(order);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// getting all orders

userRouter.get('/orders/me', auth, async (req, res) => {
	try {
		// const { id } = req.body;
		let orders = await Order.find({ userId: req.user });
		res.json(orders);
		// console.log(`\nOrder List is ==> ${orders}`);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// search history

userRouter.post('/add-to-search-history', auth, async (req, res) => {
	try {
		const { searchQuery } = req.body;

		let user = await User.findById(req.user);
		user.searchHistory.push(searchQuery.trim());

		// user.searchHistory[] = searchQuery;

		user = await user.save();
		res.json(user);
	} catch (e) {
		res.status(500).json({
			error: `Error in adding search query in DB : ${e.message}`,
		});
	}
});

userRouter.get('/get-search-history', auth, async (req, res) => {
	try {
		let user = await User.findById(req.user);
		let searchHistory = [];

		for (let i = 0; i < user.searchHistory.length; i++) {
			searchHistory[i] = user.searchHistory[i];
		}

		res.json(searchHistory);
	} catch (e) {
		res.status(500).json({
			error: `Error in fetching search history : ${e.message}`,
		});
	}
});

// getting wishList
userRouter.get('/get-wishList', auth, async (req, res) => {
	try {
		let user = User.findById(req.user);
		let wishList = [];
		wishList = user.wishList;
		res.json(wishList);
	} catch (e) {
		res.status(500).json({
			error: `Error in fetching wishList : ${e.message}`,
		});
	}
});

module.exports = userRouter;
