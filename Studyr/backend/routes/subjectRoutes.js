/*
Module Name: Subject Routes
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Express routing for subject management including CRUD operations, statistics retrieval, and user-specific subject organization
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