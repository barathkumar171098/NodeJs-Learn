const express = require('express');
const app = express();
const morgan = require('morgan');
const userRouter = require('./routes/userRotes');
const tourRouter = require('./routes/tourRoutes');
// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the Server side', app: 'Natorus API' });
// });

// app.post('/', (req, res) => {
//     res.json({"mesaage":"This is the post method"})
// })

//MIDDLEWARE
console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); /* third party middleware */
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

//Own MiddleWare
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// console.log(tours,'tours');

//ROUTE_HANDLERS

//getting All tours Data

//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
