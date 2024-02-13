const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Bookings = require("../models/bookingModel");


const getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

const getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  // if (!tour) {
  //   return next(new AppError("There is no tour with that name.", 404));
  // }

  // 2) Build template
  // 3) Render template using data from 1)
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

const getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: "Log into your account",
  });
};

const getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

// updating user detail data
const updateUserData = catchAsync(async (req, res, next) => {
  console.log(true);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { 
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

// Getting my tour data
const getMyTours = catchAsync(async (req, res, next ) => {
  //1. Find All Bookings
  const bookings = await Bookings.find({ user: req.user.id });

  //2. Find Tours With the returned ID's
  const tourIDs = await bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  }); // reusing the overview page
})

module.exports={
    getOverview,
    getTour,
    getLoginForm,
    getAccount,
    updateUserData,
    getMyTours
}
