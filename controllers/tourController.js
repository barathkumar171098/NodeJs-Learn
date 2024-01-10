const fs = require('fs');

const Tour = require('../models/tourModel');

const APIFeatures = require('../utils/apifeatures')
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

const getAllTours = async (req, res, next) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
};

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
      {
        $match: {_id: {$ne: 'EASY'}}
      }
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
    console.log(yearData);

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
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

const tourByID = async (req, res) => {
  try {
    const tourById = await Tour.findOne({ _id: req.params.id });
    // const id = req.params.id * 1;
    // const tourData = tours.find(el => el.id === id)
    // console.log(tourData, 'TourData');
    return res.status(200).json({
      status: 'Success',
      data: {
        tour: tourById,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
};

//creating tour
const createTour = async (req, res) => {
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
  try {
    const TourData = await Tour.create(req.body);
    console.log(TourData, 'TourData');
    res.status(201).json({
      status: 'Success',
      data: {
        tour: TourData,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
};

//update tour

const updateTour = async (req, res) => {
  try {
    const tourData = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      status: 'Success',
      data: {
        tourData,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${error}`,
    });
  }
};
const deleteTour = async (req, res) => {
  try {
    const tourData = await Tour.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      status: 'Success',
      data: {
        tours: tourData,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: `Invalid data sent: ${err}`,
    });
  }
};

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
