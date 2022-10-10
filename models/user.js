const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); //for forgot password random string
const { time } = require("console");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please provide a name"], //first one is its value, 2nd one is the error message if not true
		maxlength: [40, "Name should be under 40 charachters"],
	},
	email: {
		type: String,
		required: [true, "Please provide an email"],
		validate: [validator.isEmail, "Please enter email in correct format"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "Please provide password"],
		minlength: [6, "Password should be atleast 6 charachter"],
		select: false,
	},
	role: {
		type: String,
		default: "user",
	},
	photo: {
		id: {
			type: String,
			required: true,
		},
		secure_url: {
			type: String,
			required: true,
		},
	},
	forgotPasswordToken: String,
	forgotPasswordExpiry: Date,
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

//encrpy password before save -- HOOKS (pre is a hook)
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		//if the password field is not modified then nothing is done
		return next();
	}
	this.password = await bcrypt.hash(this.password, 10);
});

//validate the password with the passed on user password
userSchema.methods.isValidatedPassword = async function (userSendPassword) {
	return await bcrypt.compare(userSendPassword, this.password);
};

//create and return jwt token
userSchema.methods.getJwtToken = async function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRY,
	});
};

//generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = async function () {
	// generate a long and random string
	const forgotToken = crypto.randomBytes(20).toString("hex");

	//getting a hash -> make sure to get a hash on backend.
	this.forgotPasswordToken = crypto
		.createHash("sha256")
		.update(forgotToken)
		.digest("hex");

	//time of token
	this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

	return forgotToken;
};

module.exports = mongoose.model("User", userSchema);

/**
 * userschema ->
 * any hooks like pre,post ->
 * methods like validation of password, generation of token ->
 * make model of schema and export it
 */
