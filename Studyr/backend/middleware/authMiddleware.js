// middleware/authMiddleware.js
const authenticateToken = (req, res, next) => {
  next();
};

const validateRegistration = (req, res, next) => {
  next();
};

const validateLogin = (req, res, next) => {
  next();
};

module.exports = {
  authenticateToken,
  validateRegistration,
  validateLogin
};