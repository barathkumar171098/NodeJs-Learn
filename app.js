const express = require('express');
const morgan = require('morgan');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRotes');
const  reviewRouter = require('./routes/reviewRoutes')
const  bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes');

const rateLimit = require('express-rate-limit');
const  helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser')
const app = express();

//defining view Engine ( pug template actually called views in express )
//Basically, we access that route we now get access dynamically website based on base.pug template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));  /* built-in native module */

//GLOBAL MIDDLEWARE
//Serving static files 
app.use(express.static(path.join(__dirname, 'public')));
// console.log(process.env.NODE_ENV, 'envvvv');

//Set Security HTTP Headers
// app.use( helmet() );
app.use( helmet({ contentSecurityPolicy: false }) );

//Developement Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); /* third party middleware */
}

//Allowing IP requests based on rate Limit (Basically it's a middleware functiona)
const limiter = rateLimit({
  max: 100, /* 100 API Request imit */
  windowMs: 60 * 60 * 1000,  /* llimiting one hour */
  message: 'Too many requests from this IP, Please try again in an hour!'
})

app.use('/api',limiter); /* It is to basically limit access to API Routes */

//Body parser, reading data from the body into the req.body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


//Data Sanitization  against NoSQL Query injection 
app.use(mongoSanitize());   /* try to avoid from Attackers */

//Data Sanitization against XSS
app.use(xss());  /* try to avoid  injecting from some malicious like HTMl from Attackers */

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price'],
  })
);

// //Serving static files 
// app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

//Test(Own MiddleWare)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

app.use(cookieParser());

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
//     },
//   })
// );

// console.log(tours,'tours');

//ROUTE_HANDLERS

//getting All tours Data

//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter)
// middleWare ( handling unhandled routes )
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status:'failed',
  //   message:`Can't find this ${req.originalUrl} on this server!`
  // })

  // Built-in error constructor
  // const err = new Error(`Can't find this ${req.originalUrl} on this server!`)
  // err.status ='fail';
  // err.statusCode = 404;
  next( new AppError(`Can't find this ${req.originalUrl} on this server!`, 404),);
});

// Error handling middleware in expressJs

app.use(globalErrorHandler)

module.exports = app;
