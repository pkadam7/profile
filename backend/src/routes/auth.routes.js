const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate.middleware');

const {
  register,
  login,
  resetPasswordByEmail
} = require('../controllers/auth.controller');

const {
  registerSchema,
  loginSchema,
  resetByEmailSchema
} = require('../validators/auth.validators');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.put(
  '/reset-by-email',
  validate(resetByEmailSchema),
  resetPasswordByEmail
);

module.exports = router;