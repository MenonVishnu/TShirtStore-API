const app = require("./app");
const connectWithDb = require("./config/db");
require("dotenv").config();
const cloudinary = require("cloudinary");

//connect with database
connectWithDb();

//cloudinary config
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

//temp check
app.set("view engine", "ejs");

app.listen(process.env.PORT, () => {
	console.log(`Server is Running at Port: ${process.env.PORT}`);
});
