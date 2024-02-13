const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const { checkBody } = require("./tourController");
const Booking = require('../models/bookingModel');

const getCheckoutSession = catchAsync(async (req, res, next) => {
  1; // get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour);
  //   2. create the checkout sesion
  /* This is about the session */
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, // To proceed the payment
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // To Suceed the payment
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [        
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment'
  });
  console.log(session, "booking controller");
  // 3. Create Session as response ( sending responses back to the client)\
  res.status(200).json({
    status: "success",
    session,
  });
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

// let's factorize the create, read, update, delete API methods
const createBooking = factory.createOne(Booking);
const getBooking = factory.getOne(Booking);
const getAllBookings = factory.getAll(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);

module.exports = {
  createBookingCheckout,
  getCheckoutSession,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking
}