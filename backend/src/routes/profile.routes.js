const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");

const profileController = require("../controllers/profile.controller");
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const { profileValidator } = require("../validators/profile.validators");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

router.get("/", auth, profileController.getProfile);

router.put(
  "/",
  auth,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  profileValidator,
  validate,
  profileController.updateProfile
);

module.exports = router;