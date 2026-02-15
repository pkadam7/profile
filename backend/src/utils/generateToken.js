const jwt = require('jsonwebtoken');

module.exports = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  if (!process.env.JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN is not defined');
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};
