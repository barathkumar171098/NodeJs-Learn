const fs =  require('fs')

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const users = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
// )

// defining the filterObj function
/* loop thorugh all fields are in obj, if one of the fields are in allowed fields. Then, We creating a new field in new obj
With the same name and Same value */

const filterObj = (obj, ...allowedFields) => {
    const newObj ={};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    });
    return newObj;
}

const getAllUsers = catchAsync(async (req, res, next ) => {
    // console.log(req.requestTime, 'Request');
    const user = await User.find();
    
    res.status(200).json({
        message:"Success",
        results : user.length,
        data: {
            userData: user
        }
    })
})

//updating currently authenicated User

const updateMe = catchAsync(async (req, res, next) => {
  //1. create Error if user POST's actual password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  //2. filtering the unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");

  //3.Update User document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "Success",
    data: {
      user: updatedUser,
    },
  });
});
  
const deleteMe = catchAsync( async( req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: "success",
        data : null
    })
})
const userByID = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}

module.exports ={
    getAllUsers,
    userByID,
    createUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe
}
