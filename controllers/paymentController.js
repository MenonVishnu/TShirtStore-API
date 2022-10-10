const stripe = require("stripe")(process.env.STRIPE_SECRET);

exports.sendStripeKey = async (req, res, next) => {
	try {
		res.status(200).json({
			stripekey: process.env.STRIPE_API_KEY,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.captureStripePayment = async (req, res, next) => {
	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: req.body.amount,
			currency: "inr",

			//optional
			metadata: { integration_check: "accept_a_payment" },
		});

		res.status(200).json({
			success: true,
			amount: req.body.amount,
			client_secret: paymentIntent.client_secret,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.sendRazorpayKey = async (req, res, next) => {
	try {
		res.status(200).json({
			razorpaykey: process.env.RAZORPAY_API_KEY,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};

exports.captureRazorpayPayment = async (req, res, next) => {
	try {
		var instance = new Razorpay({
			key_id: process.env.RAZORPAY_API_KEY,
			key_secret: process.env.RAZORPAY_SECRET,
		});

		var options = {
			amount: req.body.amount,
			currency: "INR",
			// receipt: "receipt#1",
		};

		const myOrder = await instance.orders.create(options);

		res.status(200).json({
			success: true,
			amount: req.body.amount,
			order: myOrder,
		});
	} catch (error) {
		console.log(error);
		res.status(501).send(error.stack);
	}
};
