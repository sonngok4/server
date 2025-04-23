const mongoose = require("mongoose");
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
	role: {
		type: String,
		default: 'user',
		enum: ['user', 'admin'],
	},
	phone: {
		type: String,
		default: '',
	},
	address: {
		type: String,
		default: '',
	},
	avatar: {
		type: [
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
		default: [
			{
				public_id: "default_avatar",
				url: "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3467.jpg",
			},
		],
	},
	cart: [
		{
			product: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product"
			},
			quantity: {
				type: Number,
				required: true,
			},
		},
	],

	orders: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
		},
	],

	wishlist: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
		},
	],

	searchHistory: [
		{
			type: String,
		},
	],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
