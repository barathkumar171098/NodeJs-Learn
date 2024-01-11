const fs = require('fs');

const Tour = require('../models/tourModel');

const APIFeatures = require('../utils/apifeatures')
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )

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
      status: 'Failed',
      message: 'Missing name and price',
    });
  }
  next();
};

const getAllTours = catchAsync(async (req, res, next) => {
  // try {
    // //Building query
    // //1) Filtering
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(excludedFields, 'excludedFields');

    // //2)Advanced filtering
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // let query = Tour.find(JSON.parse(queryStr));

    //Executing the query
    const features = new APIFeatures(Tour.find(), req.query) // in this tour.find() is an query All object here, req.query id from express feature 
    .filter()
    .sort()
    .limitFields()
    .paginate();

    const data = await features.query;

    //Sending response to client
    res.status(200).json({
      message: 'Success',
      results: data.length,
      data: {
        tour: data,
      },
    });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: `Invalid data sent: ${error}`,
  //   });
  // }
});

//API With alias
const aliasTopTours = async (req, res, next ) => {
    try {
        req.query.limit = '5';
        req.query.sort = '-ratingsAverage,price'
        req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
        next();
    } catch(err) {
        res.status(400).json({
            status: 'failed',
            message: `Invalid data sent: ${err}`,
          });
    }
}

//getTourStats
const getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: { $gte: 4.5}}
      },
      {
        $group: {
          _id: {$toUpper:'$difficulty'},
          numTours: {$sum: 1},
          numRatings: {$sum: '$ratingsQuantity'},
          avgRating:{$avg: '$ratingsAverage'},
          avgPrice:{$avg: '$price'},
          minPrice:{$min: '$price'},
          maxPrice:{$max: '$price'}
        }
      },
      {
        $sort:{ avgPrice: 1}
      },
      // {
      //   $match: {_id: {$ne: 'EASY'}}
      // }
    ])

    res.status(200).json({
      message: 'Success',
      results: stats.length,
      data: {stats},
    });

  } catch(error) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
}

//getMonthlyPlan
const getMonthlyPlan = async (req, res) => {
  try {
    const yearData = req.params.yearData * 1;
    const plan = await Tour.aggregate([

      // This are called as "stages"
      {
        $unwind: '$startDates' /* unwind -- used to deconstruct an array field in a document */               
      },
      {
        $match: {     /* aggregation(match) This aggregation is to filter the documents */
          startDates:{
            $gte: new Date(`${yearData}-01-01`), 
            $lte: new Date(`${yearData}-12-31`)
          }
        }
      },    
      {
        $group: {   /* aggreation(group) - stage separates documents into groups according to a "group key" here inside the id have groupKey */
          _id: { $month: '$startDates'},
          numTourStarts: {$sum : 1},
          tours: {$push: '$name'}   // push -- group( accumulator operator)
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project:{            // project --  takes a document that can specify the inclusion of fields
          id: 0               // if I give 0(false) in the ID means, then only ID field will be present & if I give 1(true) in the ID means, then all field will be present
        }
      },
      {
        $sort: { 
          numTourStarts: -1    // sort -- used to specify as (-1) desc or (1) asc 
        }
      }, 
      {
        $limit: 12  // include the  obj
      }
    ]);

    res.status(200).json({
      message: 'Success',
      data: { plan },
    });


  } catch(error){
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
}

//getting tour data by ID

const tourByID = catchAsync(async (req, res, next) => {
  // try {
    const tour = await Tour.findById(req.params.id);
    console.log();
    // const id = req.params.id * 1;
    // const tourData = tours.find(el => el.id === id)
    // console.log(tourData, 'TourData');

    if(!tour){
      return next(new AppError(`No tour found in that ID`, 404))
    }
    return res.status(200).json({
      status: 'Success',
      data: {
        tour: tour,
      },
    });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: `Invalid data sent: ${error}`,
  //   });
  // }
});

//creating tour
const createTour = catchAsync(async (req, res, next) => {
  // // console.log(req.body, "request body Data");
  // // res.send("Done")

  // const newId = tours[tours.length - 1].id + 1
  // // console.log(newId,'Iddddd');

  // const newTour = Object.assign({id : newId}, req.body)
  // // console.log(newTour, "newTourDataaaaa");

  // tours.push(newTour)
  // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify (tours), err => {
  //     res.status(201).json({
  //         status:"Success"
  //     })
  // })
  // try {
    const TourData = await Tour.create(req.body);
    console.log(TourData, 'TourData');
    res.status(201).json({
      status: 'Success',
      data: {
        tour: TourData,
      },
    });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: `Invalid data sent: ${error}`,
  //   });
  // }
})

//update tour

const updateTour = catchAsync(async (req, res, next) => {
  // try {
    const tourData = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if(!tourData) {
      return next(new AppError(`No tour found in that ID`, 404))
    }

    return res.status(200).json({
      status: 'Success',
      data: {
        tourData,
      },
    });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: `Invalid data sent: ${error}`,
  //   });
  // }
});

const deleteTour = catchAsync(async (req, res, next) => {
  // try {
    const tourData = await Tour.findByIdAndDelete(req.params.id);
    console.log(tourData,"tourData");
    if(!tourData) {
      return next(new AppError(`No tour found in that ID`, 404))
    }
    return res.status(200).json({
      status: 'Success',
      data: {
        tours: tourData,
      },
    });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: `Invalid data sent: ${err}`,
  //   });
  // }
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
  getMonthlyPlan
};
