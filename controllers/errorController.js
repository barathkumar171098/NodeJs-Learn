// error handling middleware ( global handler)

const AppError = require("../utils/appError");
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};
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
  if (err.isOperational) {
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
    if (error.name === "CastError") error = handleCastErrorDB(error);
    sendErrorProd(err, res);
  }
  console.log("Error handling middleware!");
};
