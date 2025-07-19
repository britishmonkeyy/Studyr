const express = require('express');
const { getAllSubjects, createSubject, getSubjectById, deleteSubject, updateSubject } = require('../controllers/subjectController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All subject routes require authentication
router.use(authenticateToken);

// Subject routes
router.get('/', getAllSubjects);
router.post('/', createSubject);
router.get('/:id', getSubjectById);
router.delete('/:id', deleteSubject);
router.put('/:id', updateSubject);
module.exports = router;