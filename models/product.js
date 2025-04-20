const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},

	description: {
		type: String,
		required: true,
		trim: true,
	},

	brandName: {
		type: String,
		required: true,
		trim: true,
	},

	images: [
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

	stock: {
		type: Number,
		required: true,
	},

	price: {
		type: Number,
		required: true,
	},

	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category',
		required: true,
	},

	ratings: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Rating',
		}
	],
});
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
