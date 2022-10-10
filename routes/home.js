const express = require("express");
const router = express.Router();

//importing controller
const { home, homeDummy } = require("../controllers/homeController");

//routing the routes
router.route("/").get(home); //when api call to '/' it calls the home controller
router.route("/dummy").get(homeDummy);
// router.route("/login").get(home);

//exporting the router
module.exports = router;
