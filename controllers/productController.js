const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary");
const WhereClause = require("../utils/whereClause");

exports.addProduct = async (req, res, next) => {
	try {
		let imageArray = [];

		if (!req.files) {
			return next(new CustomError("images are required", 401));
		}

		if (req.files) {
			for (let index = 0; index < req.files.photos.length; index++) {
				let result = await cloudinary.v2.uploader.upload(
					req.files.photos[index].tempFilePath,
					{
						folder: "products",
					}
				);
				imageArray.push({
					id: result.public_id,
					secure_url: result.secure_url,
				});
			}
		}

		req.body.photos = imageArray;
		req.body.user = req.user.id;

		const product = await Product.create(req.body);

		res.status(200).json({
			success: true,
			product,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

exports.getAllProduct = async (req, res, next) => {
	try {
		const resultPerPage = 6;
		const totalcountProduct = await Product.countDocuments();

		const productsObject = new WhereClause(Product.find(), req.query)
			.search()
			.filter();

		let products = await productsObject.base;
		const filteredProductNumber = products.length;

		productsObject.pager(resultPerPage);
		products = await productsObject.base.clone();

		res.status(200).json({
			success: true,
			products,
			filteredProductNumber,
			totalcountProduct,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

exports.getOneProduct = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return next(new CustomError("Product not Found with this Id", 401));
		}
		res.status(200).json({
			success: true,
			product,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.addReview = async (req, res, next) => {
	try {
		const { rating, comment, productId } = req.body;

		const review = {
			user: req.user._id,
			name: req.user.name,
			rating: Number(rating),
			comment,
		};

		const product = await Product.findById(productId);

		const AlreadyReview = product.reviews.find(
			(rev) => rev.user.toString() === req.user._id.toString()
		);

		if (AldreadyReview) {
			product.reviews.forEach((review) => {
				if (review.user.toString() === req.user._id.toString()) {
					review.comment = comment;
					review.rating = rating;
				}
			});
		} else {
			product.reviews.push(review);
			product.numberOfReviews = product.reviews.length;
		}

		//adjust ratings
		product.ratings =
			product.reviews.reduce((acc, item) => item.rating + acc, 0) /
			product.reviews.length;

		await product.save({ validateBeforeSave: false });

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.deleteReview = async (req, res, next) => {
	try {
		const { productId } = req.query.producId;

		const product = await Product.findById(productId);

		const reviews = product.reviews.filter(
			(rev) => rev.user.toString() === req.user._id.toString()
		);

		const numberOfReviews = reviews.length;

		//adjust ratings
		product.ratings =
			product.reviews.reduce((acc, item) => item.rating + acc, 0) /
			product.reviews.length;

		//update the product
		await Product.findByIdAndUpdate(
			productId,
			{
				reviews,
				ratings,
				numberOfReviews,
			},
			{
				new: true,
				runValidators: true,
				useFindAndModify: false,
			}
		);

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.getOnlyReviewsForOneProduct = async (req, res, next) => {
	try {
		const product = await Product.findById(req.query.id);
		res.status(200).json({
			success: true,
			reviews: product.reviews,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

//admin only controllers
exports.adminGetAllProduct = async (req, res, next) => {
	try {
		const products = await Product.find();

		res.status(200).json({
			success: true,
			products,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.adminUpdateOneProduct = async (req, res, next) => {
	try {
		let product = await Product.findById(req.params.id);

		if (!product) {
			return next(new CustomError("Product not Found with this Id", 401));
		}

		let imagesArray;

		if (req.files) {
			//destroying the existing image
			for (let index = 0; index < product.photos.length; index++) {
				const res = await cloudinary.v2.uploader.destroy(
					product.photos[index].id
				);
			}

			//upload and save the images
			for (let index = 0; index < req.files.photos.length; index++) {
				let result = await cloudinary.v2.uploader.upload(
					req.files.photos[index].tempFilePath,
					{
						folder: "products", //folder name => .env
					}
				);
				imagesArray.push({
					id: result.public_id,
					secure_url: result.secure_url,
				});
			}
		}

		req.body.photos = imagesArray;
		product = await Product.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
			useFindAndModify: false,
		});

		res.status(200).json({
			success: true,
			product,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.adminDeleteOneProduct = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return next(new CustomError("Product not Found with this Id", 401));
		}

		//destroying the images
		for (let index = 0; index < product.photos.length; index++) {
			await cloudinary.v2.uploader.destroy(product.photos[index].id);
		}

		await product.remove();

		res.status(200).json({
			success: true,
			message: "Product was deleted!!",
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.template = async (req, res, next) => {
	try {
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};
