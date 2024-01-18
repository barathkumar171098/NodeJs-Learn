// error handling middleware ( global handler)

const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  console.log(err);
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value, 'valuesss');
  const message = `Duplicate field value: ${value}. Please use another value!`;
  console.log(message, 'MESSAGE');
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message)
  console.log(errors, 'errors');  
  const message = `Invalid input data. ${errors.join('. ')}`;
  console.log(message, 'Error message');
  return new AppError(message, 400);
}

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again', 401)


//Handling error  for  dev
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//handling error  for prod
const sendErrorProd = (err, res) => {
  // operational, trusted error: send message to client
  if (err?.isOperational) {
    console.log(err, 'inside the error on prod');
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    //programming or other unknown error: don't leak error details
  } else {
    // Log error
    console.log(`Error:${err}`);

    // send generic message

    res.status(500).json({
      status: "error",
      message: "Somenthing went wrong!",
    });
  }
};
module.exports = (err, req, res, next) => {
  //stack trace ( find out error)
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    console.log(error, 'errorMsgggg');
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidatorError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError'){
      error = handleJWTError(error);
    } 
    if(error.name === 'TokenExpiredError')    {
      console.log('inside the productions')
      error = handleJWTExpiredError()
    }  
   
    sendErrorProd(error, res);
  }
  console.log("Error handling middleware!");
};
