const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");
const router = express.Router({
  mergeParams: true,
}); /* we can get access from the Another router which we passed ID on params */

// authentication
router.use(
  authController.protect
); /* This Protect all the routes ( authenticated Useronly access) */
//POST /tour/2345278feasaw(tourID)/reviews
/* reviews are cleary are child of tour (With Logged-In user) */
router
  .route("/")
  .get(reviewController.gettingAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.CreateReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  // Here, admin and user only can updating and deleting the reviews
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  );

module.exports = router;
