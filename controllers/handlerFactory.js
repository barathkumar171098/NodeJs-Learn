/* Handler factory function in delete 
we pass the model and we create a new function */
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apifeatures");
const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    console.log(true);
    if (!doc) {
      return next(new AppError(`No tour found in that ID`, 404));
    }

    return res.status(200).json({
      status: "Success",
      data: {
        toursData: doc,
      },
    });
  });

const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "Success",
      data: {
        data: doc,
      },
    });
  });

const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    console.log(popOptions);

    //populating data : working with data in Moongose
    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate('reviews')

    // const id = req.params.id * 1;
    // const tourData = tours.find(el => el.id === id)
    // console.log(tourData, 'TourData');

    if (!doc) {
      return next(new AppError(`No document found in that ID`, 404));
    }
    return res.status(200).json({
      status: "Success",
      data: {
        data: doc,
      },
    });
  });

//handler factory  functions for getting all data
const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    /* To allows only for nested Get Reviews on tour*/
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    const features = new APIFeatures(Model.find(filter), req.query) // in this tour.find() is an query All object here, req.query id from express feature
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    //Sending response to client
    res.status(200).json({
      message: "Success",
      results: doc.length,
      data: {
        tour: doc,
      },
    });
  });

module.exports = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
};
