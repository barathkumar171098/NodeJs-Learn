
const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const router = express.Router();
// router.param('id', tourController.checkID)

/* create a CheckBody middleWare
check if contains name and price property 
If not, send back 400( bad Request) 
Add it to post handler stack */

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/tour-monthly-plan/:yearData').get(tourController.getMonthlyPlan)

router
.route('/')
.get( authController.protect,tourController.getAllTours)
.post(tourController.checkBody, tourController.createTour)


router
.route('/:id')
.get(tourController.tourByID)
.patch(tourController.updateTour)
.delete(authController.protect,
    authController.restrictTo('admin', 'lead-guide') ,
    tourController.deleteTour);

module.exports = router;