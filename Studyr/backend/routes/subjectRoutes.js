/*
Module Name: Subject Routing
Module Author: Adam Bolton
Date Modified: 8/08/2025
Description: Does CRUD operations for subject management. This handles creation, retrieval, updating, and deletion of subjects with statistics endpoint.
*/
const express = require('express');
const { 
  getAllSubjects, 
  createSubject, 
  getSubjectById, 
  deleteSubject, 
  updateSubject,
  getSubjectStats 
} = require('../controllers/subjectController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All subject routes require authentication
router.use(authenticateToken);

// Subject routes
router.get('/', getAllSubjects);              // GET /api/subjects - Get user's subjects
router.post('/', createSubject);              // POST /api/subjects - Create new subject
router.get('/stats', getSubjectStats);        // GET /api/subjects/stats - Get subject statistics
router.get('/:id', getSubjectById);           // GET /api/subjects/:id - Get specific subject
router.put('/:id', updateSubject);            // PUT /api/subjects/:id - Update subject
router.delete('/:id', deleteSubject);         // DELETE /api/subjects/:id - Delete subject

module.exports = router;