const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require('util');
// hanlded payload, secretOrPrivateKey, callback options
const sendEmail = require("../utils/email");
const crypto = require('crypto');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
    return res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user
      },
    });
}

const signUp = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    createSendToken(newUser, 201, res)
    
  } catch (err) {
    console.log(`The error is ${err}`);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //1. check if email and password exist

    if (!email || !password) {
      next(new AppError("Please provide the correct email and password", 400));
    }
    //2. check if user exists and password is correct

    const user = await User.findOne({ email }).select("+password");

    //candidate password here is password, hashed password is placed at  user.password

    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
      return next(new AppError("Incorrect email or password is entered", 404));
    }
    //3. If everything good, send token to the client
    createSendToken(user, 200, res)
  } catch (err) {
    console.log(`The error is ${err}`);
  }
};

const protect = catchAsync(async (req, res, next) => {
  // documents are instances of a model
  //1.Getting token and check of it's Id
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1]
  }
  console.log(token, 'tokenData');

  if(!token){
    return next(new AppError("You are not logged in! Please log in to get access", 401));

  }
  //2.Verification Token ( validating token data )
 const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  //3. check if user is still exists
  const currentUser = await User.findById(decoded.id)
  if(!currentUser){
    return next(new AppError('The user belonging to this token does no longer exists', 401))
  }
  //4. check if user changed the password after the JWT was issued
  if(currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError('User recently changed password! Please login in again', 401))
  }

  ///5. Grant access to protected Routes
  req.user = currentUser;

  next();
})

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have a permission to perform this action", 403)
      );
    }
  next();
  };
};

//forgot password


const forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  //2.Generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3.Send it to the user's email
  //sending plain original resetToken and not encryted one
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and 
  passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: "success",
      message: "Token send to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the mail. pls try agin later!"),
      500
    );
  }
  
});

// reset password
const resetPassword = catchAsync(async (req, res, next) => {
  //1.Get User based on the token ( The encrypted token are stored at DB && basically encrypt the original token and compare it With encrypted token whcih is stored at the Database to Identify the User )
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest("hex");

  // This will find the user, that will send via URL
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2.If the token has not expired and there is user, set the new Password
  if(!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  //confirming the password via the body
  // validate the password confirm with the password using Validator
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm

  //delete the reset token and the expired one
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //saving the data 
  await user.save();
  //3.update changedPasswordAt property for the current user
  //4.log the user in, send JWT

  createSendToken(user, 200, res)
})   

//update password 
const  updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  console.log(req.user.id);
  const user = await User.findById(req.user.id).select("+password")

  //2.check if POST ed current password is correct or not
  if(!user.correctPassword(req.body.passwordCurrent, user.password)){
    return next(new AppError('You current password is wrong.', 401))
  }
  //3.If so, update the password
  // validation will be done automatically by validator defined on the User Model Schema
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm

  await user.save();
  
  // user.findByIdAndUpdate will not work as intended!
  //4.log user in, send JWT ( if user is logged in, after that token gets stored as JWT environment variable which it is setup in TEST Options)
  createSendToken(user, 200, res)
})

module.exports = {
  signUp,
  login,
  signToken,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  createSendToken,
  updatePassword
};
