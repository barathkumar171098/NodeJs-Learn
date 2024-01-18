const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/userRotes');
const tourRouter = require('./routes/tourRoutes');

const app = express();
const globalErrorHandler = require('./controllers/errorController')
const AppError = require('./utils/appError');

//MIDDLEWARE
// console.log(process.env.NODE_ENV, 'envvvv');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); /* third party middleware */
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

//Own MiddleWare
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// console.log(tours,'tours');

//ROUTE_HANDLERS

//getting All tours Data

//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// middleWare ( handling unhandled routes )
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status:'failed',
  //   message:`Can't find this ${req.originalUrl} on this server!`
  // })

  //Built-in error constructor
  // const err = new Error(`Can't find this ${req.originalUrl} on this server!`)
  // err.status ='fail';
  // err.statusCode = 404;
  next( new AppError(`Can't find this ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware in expressJs

app.use(globalErrorHandler)

module.exports = app;
