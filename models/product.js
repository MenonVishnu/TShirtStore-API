const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please provide product name"],
		trim: true,
		maxLength: [120, "Product name should not be more than 120 charachters"],
	},
	price: {
		type: Number,
		required: [true, "Please provide product price"],
		maxLength: [5, "Product price should not be more than 5 digits"],
	},
	description: {
		type: String,
		required: [true, "Please provide product description"],
	},
	photos: [
		{
			id: {
				type: String,
				required: true,
			},
			secure_url: {
				type: String,
				required: true,
			},
		},
	],
	category: {
		type: String,
		required: [
			true,
			"Please select categories from- short-sleeves, long-sleeves, sweat-shirts, hoodies",
		],
		enum: {
			values: ["shortsleeves", "longsleeves", "sweatshirt", "hoodies"],
			message:
				"Please select categories only from- short-sleeves, long-sleeves, sweat-shirts, hoodies",
		},
	},
	stock: {
		type: Number,
		required: [true, "Please add a number in stock"],
	},
	brand: {
		type: String,
		required: [true, "Please add a brand for clothing"],
	},
	rating: {
		type: Number,
		default: 0,
	},
	numberOfReviews: {
		type: Number,
		default: 0,
	},
	reviews: [
		{
			user: {
				type: mongoose.Schema.ObjectId, //object_id for unique identification
				ref: "User", //model name
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			rating: {
				type: Number,
				required: true,
			},
			comment: {
				type: String,
				required: true,
			},
		},
	],
	user: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now, // not Date.now() because we dont want to execute it now.
	},
});

module.exports = mongoose.model("Product", productSchema);
