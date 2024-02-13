const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.route("/signUp").post(authController.signUp);
router.post("/login", authController.login);
router.get("/logout",authController.logout);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

/* This protect middleware, where we can use after every upcoming middleware
like this middleware after that it Will use next at patch Method here */
// This protects all routes after this middleware
router.use(authController.protect);

//Here protect is used only allowing Logged in users controlls after that Another middleWare Will Works
router.patch("/updateMyPassword", authController.updatePassword);

// By using this middleware (Getting Own Info), We can get the Current logged in user data through this routes
router.get(
  "/me",
  // authController.protect, /* here, This (authController.protect) is used only for Authenticated Users only allows for further middleware */
  userController.getMe,
  userController.userByID
);

// using Protect method To allows only the authenticated user can update ( protect MiddleWare)
router.patch("/updateMe", userController.uploadUserPhoto, userController.resizeUserPhoto , userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

/* This Middleware actually used for only 
admin can get the users, 
createUser, 
getAllusers data, 
Update User, 
delete User data 
But before this middleware every One access the before routes*/

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.userByID)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
