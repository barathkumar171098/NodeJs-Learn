const moongose = require("mongoose");

const slugify = require("slugify");
const validator = require("validator");
const tourSchema = new moongose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, // to round the value like => 4.6666667 => 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation ( not on update)
          return val < this.price; // 100 < 200 ( true ) /  250< 200 ( false)
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    // Created Embedded documents ( this are really a documents, not only a objects) using moongoose
    // documents that are nested within other documents
    startLocation: {
      //GeoJson- order to specify the geospatial data
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // child referencing
    // guides: Array
    guides: [
      {
        type: moongose.Schema.ObjectId,
        ref: "User",
      },
    ],

    // Parent referencing
    // reviews: [
    //   {
    //     type: moongose.Schema.ObjectId,
    //     ref:'Review'
    //   }
    // ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({price: 1})
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: "2dsphere" });
  
// virtual properties ( MongoDb )
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id" /* Stored ID, it is in the local Model */,
});
// Document Middleware: runs before .save() and .create()
//pre (pre save hooks) middleware and post middleware

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Moongoose Middleware used before saving a document to the database
// basically pre-save hook
// creating for new documents instead of updating, Not for updating
// tourSchema.pre('save', async function(next) {
//   //iterating each element with an  User ID
//   console.log(true);
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises)
//   console.log(guidesPromises,'guidesPromises');
//   next();
// })

//Query handling Middleware

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// populating data through Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // this.find({secretTour: {$ne: true}})
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//  aggregation middleware
// tourSchema.pre('aggregate', function (next){
//   this.pipeline().unshift({$match: {secretTour: { $ne: true}}})
//   console.log(this.pipeline());
//   next();
// })

const Tour = moongose.model("Tour", tourSchema);

module.exports = Tour;
