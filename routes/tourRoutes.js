const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRoutes");
const router = express.Router();
// router.param('id', tourController.checkID)

//POST /tour/2345278featy(tourID)/reviews   //reviews are cleary are child of tour (With Logged-In user)
//GET /tour/2345278featy(tourID)/reviews
//GET /tour/2345278featy(tourID)/reviews/9625892 (reviewID)

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.CreateReview
//   );

router.use("/:tourId/reviews", reviewRouter);
/* create a CheckBody middleWare
check if contains name and price property 
If not, send back 400( bad Request) 
Add it to post handler stack */

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/tour-monthly-plan/:yearData")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
/*/tours-distance?distance=233&center=-40,45&unit=mi */
//Another procedure -- tours-distance/233/center/-40,45/unit/mi

//Calculating distances from certain point to all the tours
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router.route("/").get(authController.protect, tourController.getAllTours).post(
  authController.protect,
  authController.restrictTo("admin", "lead-guide"),
  // tourController.checkBody,
  tourController.createTour
);

router
  .route("/:id")
  .get(
    tourController.tourByID
  ) /* This is getting single tour data, (It is available to every One) */
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "guide", "lead-guide"),
    tourController.deleteTour
  );

// Here, creating & editing tours is only allow lead guides, administrators to perform the API Actions
// And then, Normal users & guides are not able to perform that.

module.exports = router;
