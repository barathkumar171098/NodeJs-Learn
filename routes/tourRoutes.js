
const express = require('express')
const tourController = require('../controllers/tourController')
const router = express.Router();
// router.param('id', tourController.checkID)

/* create a CheckBody middleWare
check if contains name and price property 
If not, send back 400( bad Request) 
Add it to post handler stack */

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/tour-monthly-plan/:year').get(tourController.getMonthlyPlan)

router
.route('/')
.get(tourController.getAllTours)
.post(tourController.checkBody, tourController.createTour)


router
.route('/:id')
.get(tourController.tourByID)
.patch(tourController.updateTour)
.delete(tourController.deleteTour);

module.exports = router;