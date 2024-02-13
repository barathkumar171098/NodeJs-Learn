const APIFeatures = require("../utils/apifeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

// const gettingAllReview = catchAsync(async (req, res, next) => {

const gettingAllReviews = factory.getAll(Review);
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "Success",
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

//created  middleware for setting Tour/UserId's
/* Which we going to handle at router middleWare */
const setTourUserIds = (req, res, next) => {
  // This is for allowing nested Routes
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
};

//building Handler Factory functions:
const getReview = factory.getOne(Review);
const CreateReview = factory.createOne(Review);
const deleteReview = factory.deleteOne(Review);
const updateReview = factory.updateOne(Review);

module.exports = {
  gettingAllReviews,
  CreateReview,
  deleteReview,
  setTourUserIds,
  updateReview,
  getReview,
};
