const fs = require("fs");
const multer = require('multer')
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
// const sharp = require('sharp')
const Jimp = require('jimp');

// MULTER_MIDDLEWARE
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users')
//   },
//   filename:(req, file, callback) => {
//     // fileName eg: user-7637363838dbaa-76282829633.jpeg
//     const ext = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`) // storing the file with the destination and filename
//   }
// })
const multerStorage = multer.memoryStorage();
//creating multer filter 

const multerFilter = (req, file, callback) => {
  if(file.mimetype.startsWith('image')) {
    callback(null, true)
  } else {
    callback(new AppError('Not an image! Please upload only images', 400), false)
  }
}
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// const users = JSON.parse(
  //     fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
// )

// defining the filterObj function
/* loop thorugh all fields are in obj, if one of the fields are in allowed fields. Then, We creating a new field in new obj
With the same name and Same value */

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// const getAllUsers = catchAsync(async (req, res, next ) => {
//     // console.log(req.requestTime, 'Request');
//     const user = await User.find();

//     res.status(200).json({
//         message:"Success",
//         results : user.length,
//         data: {
//             userData: user
//         }
//     })
// })

const getAllUsers = factory.getAll(User);

//This middleware is used before the calling getOne API method
const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

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

  if(req.file){
    filteredBody.photo = req.file.filename;
  }

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

const deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const uploadUserPhoto = upload.single('photo');

/* Created a new Middleware function this is running 
after the photo is uploaded 
upload is actually happening to a buffer and no longer to file system 
and using lib, We resized it to square &
then formatted to JPEG With quality of 90 percent 
*/
const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const image = await Jimp.read(req.file.buffer);
  await image
    .resize(500, 500)
    .quality(90)
    .writeAsync(`public/img/users/${req.file.filename}`);
    next();
}); 

const createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This Route is not yet defined! Please signUp instead!",
  });
};

// all middleware Which doesn't run safely in factory fn,
//do not need to attempt change password, While update
const userByID = factory.getOne(User);
const updateUser = factory.updateOne(User);
const deleteUser = factory.deleteOne(User);

module.exports = {
  getAllUsers,
  userByID,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
};
