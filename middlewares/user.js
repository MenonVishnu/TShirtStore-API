const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const jwt = require("jsonwebtoken");

// This method first checks weather token is present in the cookies or not or in the header.
// the format of token in header is as follows:
//     Authorization: Bearer <token>
// if the token is not present then tell user to login first
// if the token is present decode it using jwt.verify which gives us the id which was used for signing
// we find the user using this id from mongodb using findById method and store it in a
// new userdefined property of req which is req.user.

exports.isLoggedIn = async (req, res, next) => {
	try {
		const token =
			req.cookies.token || req.header("Authorization").replace("Bearer ", "");

		if (!token) {
			return next(CustomError(`Login first to access this page`, 401));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		req.user = await User.findById(decoded.id);

		next();
	} catch (err) {
		console.log(err);
		res.status(400).send(err.stack);
	}
};

exports.customRole = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new CustomError("You are not allowed for this resource", 402)
			);
		}
		next();
	};
};
