const mongoose = require('mongoose');
const { productSchema } = require('./product');

const userSchema = mongoose.Schema({
	name: {
		required: true,
		type: String,
		trim: true,
	},
	email: {
		required: true,
		type: String,
		trim: true,
	},
	password: {
		required: true,
		type: String,
	},

	address: {
		type: String,
		default: '',
	},
	type: {
		type: String,
		default: 'user',
	},
	avatar: [
		{
			public_id: {
				type: String,
				required: true,
			},
			url: {
				type: String,
				required: true,
			},
		},
	],
	// cart
	cart: [
		{
			product: productSchema,
			quantity: {
				type: Number,
				required: true,
			},
		},
	],

	wishList: [
		{
			product: productSchema,
		},
	],

	searchHistory: [
		{
			type: String,
		},
	],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
