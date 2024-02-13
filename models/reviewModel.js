//Review
//Rating //
// createdAt
//ref to Tour
//ref To User

const mongoose = require("mongoose");
const Tour = require("../models/tourModel");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review Cannot be Empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A Review must belong to a user"],
    },
  },
  // virtual property : Used because of, Basically a field that is not stored in DB, but calculating some other values
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// populating data through Query Middleware

/* Previously, Done parent referncing on a review 
and then haven't no access for its corresponding reviews. So, that 
we done child referncing on the tours 
Keeping the reference to all the child documents on parent documents */

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // }).populate({
  //   path: "user",
  //   select: "name photo",
  // });
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

/* Document MiddleWare */
/* 1. created the function as static method, 
   2. because we need to aggregate function On model
   3. We constructed our aggregation pipeline
   4.selected All Reviews that matched Current tourID
   5.calculation process
   6.After calc, then Saved the statis data to current Tour, This function is using While during new review 
   has been created
   7. Which it points into this.constructor( current Model)
*/
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId, "tourID");
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  console.log(stats, "stats_result");

  if (stats.length > 0) {
    // persisting( updating) data into current Tour document(DB)
    await Tour.findByIdAndUpdate(tourId, {
      // Actually it's came as Array of Obj, Poiinting into first position as Zero in Array, from that can take two property
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// need to use post method instead of pre : because it's not saved into the collection just yet
// when we use post docu are already saved in DB, then calc activity will process
/* In Post middleware, can't use next Fn */

reviewSchema.post("save", function () {
  // This points to current review

  // Here, the Constructor is declared as  basically a current model
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndupdate
// findByIdAndDelete
// pre-middleware ( Here we using pre- middleWare hooks for findOneAndupdate && findOneAndDelete )
// Goal: try to getting a Current review document
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});
/* Steps: In this (this.r) is used to passing the data from Pre-middleware to Post middleware 
   And Then we retrieving the review doc from r variable*/
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne();   // does Not work here, Query has already executed
  await this.r.constructor.calcAverageRatings(
    this.r.tour
  ); /* This is a static Method, we call it on model*/
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
