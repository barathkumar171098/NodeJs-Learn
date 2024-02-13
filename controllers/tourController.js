const fs = require("fs");
const multer = require('multer');
const Jimp = require('jimp');
const Tour = require("../models/tourModel");

const APIFeatures = require("../utils/apifeatures");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )

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

const uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
])

const resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);

  if(!req.files.imageCover || !req.files.images){
    return next();
  }
  // 1. Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  const image = await Jimp.read(req.files.imageCover[0].buffer);
  await image
    .resize(2000, 1333)
    .quality(90)
    .writeAsync(`public/img/tours/${req.body.imageCover}`);

  // 2. Images
  req.body.images = [];

  // we can use 'map' insetad of forEach here, awaiting promise all like upload all of tour images.
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const image = await Jimp.read(file.buffer);
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await image
        .resize(2000, 1333)
        .quality(90)
        .writeAsync(`public/img/tours/${filename}`);
        console.log(filename);
      req.body.images.push(filename);
    })
  );
  console.log();
  next();
});

const checkID = (req, res, next, val) => {
  // console.log(`Tour id  is: ${val}`);
  // if(req.params.id * 1 > tours.length){
  //     console.log(tours.length,'lengthss');
  //     return res.status(404).json({
  //        status: "Failed",
  //        message: "This is an Invalid ID"
  //     })
  // }
  next();
};

const checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: "Failed",
      message: "Missing name and price",
    });
  }
  next();
};

const getAllTours = factory.getAll(Tour);
// const getAllTours = async (req, res, next) => {
//   try {
//     // //Building query
//     // //1) Filtering
//     // const queryObj = { ...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // excludedFields.forEach((el) => delete queryObj[el]);
//     // console.log(excludedFields, 'excludedFields');

//     // //2)Advanced filtering
//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     // let query = Tour.find(JSON.parse(queryStr));

//     //Executing the query
//     const features = new APIFeatures(Tour.find(), req.query) // in this tour.find() is an query All object here, req.query id from express feature
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//     const data = await features.query;

//     //Sending response to client
//     res.status(200).json({
//       message: 'Success',
//       results: data.length,
//       data: {
//         tour: data,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'failed',
//       message: `Invalid data sent: ${error}`,
//     });
//   }
// }

//API With alias
const aliasTopTours = async (req, res, next) => {
  try {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: `Invalid data sent: ${err}`,
    });
  }
};

//getTourStats
const getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: {_id: {$ne: 'EASY'}}
      // }
    ]);

    res.status(200).json({
      message: "Success",
      results: stats.length,
      data: { stats },
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: `Invalid data sent: ${error}`,
    });
  }
};

//getMonthlyPlan
const getMonthlyPlan = async (req, res) => {
  try {
    const yearData = req.params.yearData * 1;
    const plan = await Tour.aggregate([
      // This are called as "stages"
      {
        $unwind:
          "$startDates" /* unwind -- used to deconstruct an array field in a document */,
      },
      {
        $match: {
          /* aggregation(match) This aggregation is to filter the documents */
          startDates: {
            $gte: new Date(`${yearData}-01-01`),
            $lte: new Date(`${yearData}-12-31`),
          },
        },
      },
      {
        $group: {
          /* aggreation(group) - stage separates documents into groups according to a "group key" here inside the id have groupKey */
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" }, // push -- group( accumulator operator)
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: {
          // project --  takes a document that can specify the inclusion of fields
          id: 0, // if I give 0(false) in the ID means, then only ID field will be present & if I give 1(true) in the ID means, then all field will be present
        },
      },
      {
        $sort: {
          numTourStarts: -1, // sort -- used to specify as (-1) desc or (1) asc
        },
      },
      {
        $limit: 12, // include the  obj
      },
    ]);

    res.status(200).json({
      message: "Success",
      data: { plan },
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: `Invalid data sent: ${error}`,
    });
  }
};

//getting tour data by ID

//factory fn, here I used path for reviews thorugh populate options
const tourByID = factory.getOne(Tour, { path: "reviews" });
// const tourByID = catchAsync(async (req, res, next) => {
//   //populating data : working with data in Moongose
//     const tour = await Tour.findById(req.params.id).populate('reviews')

//     // const id = req.params.id * 1;
//     // const tourData = tours.find(el => el.id === id)
//     // console.log(tourData, 'TourData');

//     if(!tour){
//       return next(new AppError(`No tour found in that ID`, 404))
//     }
//     return res.status(200).json({
//       status: 'Success',
//       data: {
//         tour: tour,
//       },
//     });
// });

//creating tour
const createTour = factory.createOne(Tour);
// const createTour = catchAsync(async (req, res, next) => {
//   // // console.log(req.body, "request body Data");
//   // // res.send("Done")

//   // const newId = tours[tours.length - 1].id + 1
//   // // console.log(newId,'Iddddd');

//   // const newTour = Object.assign({id : newId}, req.body)
//   // // console.log(newTour, "newTourDataaaaa");

//   // tours.push(newTour)
//   // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify (tours), err => {
//   //     res.status(201).json({
//   //         status:"Success"
//   //     })
//   // })
//   // try {
//     const TourData = await Tour.create(req.body);
//     // console.log(TourData, 'TourData');
//     res.status(201).json({
//       status: 'Success',
//       data: {
//         tour: TourData,
//       },
//     });
//   // } catch (error) {
//   //   res.status(400).json({
//   //     status: 'failed',
//   //     message: `Invalid data sent: ${error}`,
//   //   });
//   // }
// })

//update tour

const updateTour = factory.updateOne(Tour);

// calling a deleteOne function and passing the model
/* using closure, it replace the another passed one. Which means, inner function 
will get access to variable of outer function even already returned  */

const deleteTour = factory.deleteOne(Tour);

/*/tours-distance?distance=233&center=-40,45&unit=mi */
// 11.100506,76.5406632
//Another procedure -- tours-distance/233/center/-40,45/unit/mi
const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  // expecting radius of sphere to be in radians
  //radius of our sphere and we get by dividig the distance
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        "Please Provide latitude and longitude in the format lat lng.",
        400
      )
    );
  }
  console.log(distance, latlng, unit);

  // GeoSpatial Operators ( MongoDB Docs) to find the tours Within radius
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  return res.status(200).json({
    results: tours.length,
    status: "Success",
    data: {
      data: tours,
    },
  });
});

// This method is similiar to geoToursWithin (similiar units, lat, lng)
// aggregation pipeline is used to take the distnace calculation
// const getDistances = catchAsync(async (req, res, next) => {
//   const { latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   if (!lat || !lng) {
//     next(
//       new AppError(
//         "Please Provide latitude and longitude in the format lat lng.",
//         400
//       )
//     );
//   }
//   console.log(true);
//   const distances = await Tour.aggregate([
//     {
//       $geoNear: {
//         near: {
//           type: 'Point',
//           coordinates: [lng * 1, lat * 1], // converting str to number using  ( * 1 )
//         },
//         distanceField: 'distance', // this field require all the calculated distances will be stored
//       } /* It requires one of our fields -- Both 2dsphere and 2d geospatial indexes support $geoWithin like it contains geospatial Index*/,
//     },
//   ]);
//   return res.status(200).json({
//     status: "Success",
//     data: {
//       data: distances,
//     },
//   });
// });

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitutr and longitude in the format lat,lng.",
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  return res.status(200).json({
    status: "success",
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
module.exports = {
  getAllTours,
  tourByID,
  createTour,
  updateTour,
  deleteTour,
  checkID,
  checkBody,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
};
