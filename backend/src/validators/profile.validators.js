const { body } = require("express-validator");

exports.profileValidator = [
  body("firstName").optional().isLength({ min: 2 }),
  body("lastName").optional().isLength({ min: 2 }),
  body("phone").optional().isLength({ min: 6 }),
  body("bio").optional().isLength({ max: 500 }),
  body("skills").optional().isLength({ max: 500 }),
];