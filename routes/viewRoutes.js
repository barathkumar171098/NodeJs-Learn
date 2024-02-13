const express = require("express");

const viewsController = require("../controllers/viewsController");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");
const router = express.Router();

// router.get("/", (req, res) => {
//   res.status(200).render("base", {
//     tour: "The Forest Hiker",
//     user: "Jonas",
//   });
// }); /* Which for rendering pages in a browser */

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);
// router.get("/tour", viewsController.getTour);
router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm); // this is going to rendering the pages
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
