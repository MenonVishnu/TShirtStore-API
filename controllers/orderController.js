const Order = require("../models/order");
const Product = require("../models/product");
const CustomError = require("../utils/customError");

exports.createOrder = async (req, res, next) => {
	try {
		const {
			shippingInfo,
			orderItems,
			paymentInfo,
			taxAmount,
			shippingAmount,
			totalAmount,
		} = req.body;

		const order = await Order.create({
			shippingInfo,
			orderItems,
			paymentInfo,
			taxAmount,
			shippingAmount,
			totalAmount,
			user: req.user._id,
		});

		res.status(201).json({
			success: true,
			order,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send(error.stack);
	}
};

exports.getOneOrder = async (req, res, next) => {
	try {
		const order = await Order.findById(req.params.id).populate(
			"user",
			"name email"
		);

		if (!order) {
			return next(new CustomError("Please check order id", 401));
		}

		res.status(200).json({
			success: true,
			order,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.getLoggedInOrders = async (req, res, next) => {
	try {
		const order = await Order.find({ user: req.user._id });

		if (!order) {
			return next(new CustomError("Please check order id", 401));
		}

		res.status(200).json({
			success: true,
			order,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

//admin controllers
exports.admingetAllOrders = async (req, res, next) => {
	try {
		const orders = await Order.find();

		res.status(200).json({
			success: true,
			orders,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.adminUpdateOrder = async (req, res, next) => {
	try {
		const order = await Order.findById(req.params.id);

		if (!order) {
			return next(new CustomError("Please check order id", 401));
		}

		if (order.orderStatus === "Delivered") {
			return next(
				new CustomError("Order is aldready marked for delivered", 401)
			);
		}

		order.orderStatus = req.body.orderStatus;

		order.orderItems.forEach(async (prod) => {
			await updateProductStock(prod.product, prod.quantity);
		});

		await order.save();

		res.status(200).json({
			success: true,
			order,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};
async function updateProductStock(productId, quantity) {
	const product = await Product.findById(productId);

	if (product.stock < quantity) {
		return next(
			new CustomError("Quantity Ordered is not available in stock", 401)
		);
	}
	product.stock = product.stock - quantity;

	await product.save({ validateBeforeSave: false });
}

exports.adminDeleteOrder = async (req, res, next) => {
	try {
		const order = await Order.findById(req.params.id);

		await order.remove();

		res.status(200).json({
			success: true,
			message: "Order has been deleted",
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};
