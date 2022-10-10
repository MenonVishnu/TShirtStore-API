const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise(async (req, res) => {
	res.status(200).json({
		success: true,
		greeting: "Hello from API",
	});
});
exports.homeDummy = async (req, res) => {
	try {
		res.status(200).json({
			success: true,
			greeting: "This is another dummy route",
		});
	} catch (error) {
		console.log(error);
	}
};

// home = (req, res) => {
// 	res.status(200).json({
// 		success: true,
// 		greeting: "Hello from API",
// 	});
// };
// homeDummy = (req, res) => {
// 	res.status(200).json({
// 		success: true,
// 		greeting: "This is another dummy route",
// 	});
// };

// module.exports = { home, homeDummy };
