const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signup = async (req, res, next) => {
	try {
		// res.status(201).send("Signup");
		const { name, email, password } = req.body;
		if (!email || !name || !password) {
			// return next(new Error("Please send Email"));
			return next(
				new CustomError("Name, Email and Password are required", 400)
			);
		}

		if (!req.files) {
			return next(new CustomError("Photo is required for signup", 400));
		}
		let file = req.files.photo;
		const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
			folder: "users",
			width: 150,
			crop: "scale",
		});

		const user = await User.create({
			name,
			email,
			password,
			photo: {
				id: result.public_id,
				secure_url: result.secure_url,
			},
		});

		cookieToken(user, res);
	} catch (error) {
		console.log(error);
		res.status(500).send(error.stack);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		//check for presence of email and password
		if (!email || !password) {
			return next(new CustomError(`PLease provide email and password`, 400));
		}

		//get user from db
		const user = await User.findOne({ email }).select("+password");

		//if user not found in db
		if (!user) {
			return next(
				new CustomError(`Email or Password does not Match or Exist`, 400)
			);
		}

		//match the password
		const isPasswordCorrect = await user.isValidatedPassword(password);

		//if password do not match
		if (!isPasswordCorrect) {
			return next(
				new CustomError(`Email or Password does not Match or Exist`, 400)
			);
		}

		//if all goes good and we send the token
		cookieToken(user, res);
	} catch (err) {
		console.log(err);
		res.status(500).send(err.stack);
	}
};

exports.logout = async (req, res, next) => {
	try {
		res.cookie("token", null, {
			expires: new Date(Date.now()),
			httpOnly: true,
		});

		res.status(200).json({
			success: true,
			message: "Logout Success",
		});
	} catch (err) {
		console.log(err);
		res.status(500).send(err.stack);
	}
};

exports.forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });

		if (!user) {
			return next(new CustomError(`Email not found as registered`, 400));
		}

		const forgotToken = await user.getForgotPasswordToken();

		await user.save({ validateBeforeSave: false });

		const myUrl = `${req.protocol}://${req.get(
			"host"
		)}/api/v1/password/reset/${forgotToken}`;

		const message = `Copy Paste this link in your URL and hit enter \n\n ${myUrl}`;

		try {
			await mailHelper({
				email: user.email,
				subject: "LCO TStore - Password Reset Email",
				message,
			});

			res.status(200).json({
				success: true,
				message: "Email Sent successfully",
			});
		} catch (err) {
			user.forgotPasswordToken = undefined;
			user.forgotPasswordExpiry = undefined;
			await user.save({ validateBeforeSave: false });

			return next(CustomError(err.message, 500));
		}
	} catch (err) {
		console.log(err);
		res.status(500).send(err.stack);
	}
};

exports.passwordReset = async (req, res, next) => {
	try {
		const token = req.params.token;

		const encryToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			encryToken,
			forgotPasswordExpiry: { $gt: Date.now() },
		});

		if (!user) {
			return next(CustomError(`Token is invalid or expired!!`, 400));
		}

		if (req.body.password !== req.body.confirmPassword) {
			return next(
				CustomError(`Password and confirmed password does not match`, 400)
			);
		}

		user.password = req.body.password;
		user.forgotPasswordExpiry = undefined;
		user.forgotPasswordToken = undefined;

		await user.save();

		//send a JSON response or send token
		cookieToken(user, res);
	} catch (err) {
		console.log(err);
		res.status(500).send(err.stack);
	}
};

exports.getLoggedInUserDetails = async (req, res, next) => {
	try {
		const user = await User.findById(req.user);

		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

/*
Get the user id from req.user which is set when the user is logged in
get the user from database and select password as it is not selected by default
check the old password recieved from req.body is equal to the password in the database
if no - raise error
else update the password in the database and generate a new cookie

*/
exports.changePassword = async (req, res, next) => {
	try {
		const userId = req.user;
		const user = await User.findById(userId).select("+password");

		const isCorrectOldPassword = await user.isValidatedPassword(
			req.body.oldPassword
		);

		if (!isCorrectOldPassword) {
			return next(new CustomError("Old password is invalid", 400));
		}

		user.password = req.body.password;

		await user.save();

		cookieToken(user, res);
	} catch (error) {
		console.log(error);
		res.status(500).send(error.stack);
	}
};

exports.updateUserDetails = async (req, res, next) => {
	try {
		//add a check for email and name in body
		if (!req.body.name || !req.body.email) {
			return next(new CustomError("Email and Name is blank!!", 400));
		}

		const newData = {
			name: req.body.name,
			email: req.body.email,
		};

		if (req.files) {
			const user = await User.findById(req.user.id);

			const imageId = user.photo.id;

			//delete photo on cloudinary
			const resp = await cloudinary.v2.uploader.destroy(imageId);

			//upload the new photo
			const result = await cloudinary.v2.uploader.upload(
				req.files.photo.tempFilePath,
				{
					folder: "users",
					width: 150,
					crop: "scale",
				}
			);

			newData.photo = {
				id: result.public_id,
				secure_url: result.secure_url,
			};
		}

		const user = await User.findByIdAndUpdate(req.user.id, newData, {
			new: true,
			runValidators: true,
			useFindAndModify: false,
		});

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

exports.adminAllUser = async (req, res, next) => {
	try {
		const users = await User.find();

		res.status(200).json({
			success: true,
			users,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

exports.admingetOneUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user) {
			return next(new CustomError("No User Found!!", 400));
		}

		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		console.log(error);
		res.status(401).send(error.stack);
	}
};

exports.adminUpdateOneUserDetails = async (req, res, next) => {
	try {
		const newData = {
			name: req.body.name,
			email: req.body.email,
			role: req.body.role,
		};

		const user = await User.findByIdAndUpdate(req.params.id, newData, {
			new: true,
			runValidators: true,
			useFindAndModify: false,
		});

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(400).send(error.stack);
	}
};

exports.adminDeleteOneUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return next(new CustomError("No such user Found", 401));
		}

		const imageId = user.photo.id;

		await cloudinary.v2.uploader.destroy(imageId);
		await user.remove();
		res.status(200).json({
			success: true,
		});
	} catch (error) {
		res.status(500).send(error.stack);
	}
};

exports.managerAllUser = async (req, res, next) => {
	try {
		const users = await User.find({ role: "user" });
		res.status(200).json({
			success: true,
			users,
		});
	} catch (error) {
		console.log(error);
		res.status(401).send(error.stack);
	}
};
// exports.signup = BigPromise(async (req, res, next) => {
// 	let result;

// 	if (req.files) {
// 		let file = req.files.photo;
// 		result = await cloudinary.v2.upload(file, {
// 			folder: "users",
// 			width: 150,
// 			crop: "scale",
// 		});
// 	}

// 	// res.status(201).send("Signup");
// 	const { name, email, password } = req.body;
// 	if (!email || !name || !password) {
// 		// return next(new Error("Please send Email"));
// 		return next(new CustomError("Name, Email and Password are required", 400));
// 	}

// 	const user = await User.create({
// 		name,
// 		email,
// 		password,
// 		photo: {
// 			id: result.public_id,
// 			secure_url: result.secure_url,
// 		},
// 	});

// 	cookieToken(user, res);
// });
