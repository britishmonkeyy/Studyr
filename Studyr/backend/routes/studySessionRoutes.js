const express = require('express');
const {
  getUserStudySessions,
  createStudySession,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
  completeStudySession
} = require('../controllers/studySessionController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All session routes require authentication
router.use(authenticateToken);

// Study session routes
router.get('/', getUserStudySessions);
router.post('/', createStudySession);
router.get('/:id', getStudySessionById);
router.put('/:id', updateStudySession);
router.delete('/:id', deleteStudySession);
router.post('/:id/complete', completeStudySession);

module.exports = router;