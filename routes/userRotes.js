const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/signUp").post(authController.signUp);
router.route("/login").post(authController.login);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

//Here protect is used only allowing Logged in users controlls after that Another middleWare Will Works
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

// using Protect method To allows only the authenticated user can update ( protect MiddleWare)
router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);
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
