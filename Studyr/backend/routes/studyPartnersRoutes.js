/*
Module Name: Study Partners Routes
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Express routing for study partner management including partnership requests, responses, partner search, and relationship management
*/
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getPartnershipRequests,
  getAcceptedPartners,
  sendPartnershipRequest,
  respondToPartnershipRequest,
  searchStudyPartners,
  removePartnership
} = require('../controllers/studyPartnersController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/partners/requests - Get all partnership requests (sent and received)
router.get('/requests', getPartnershipRequests);

// GET /api/partners/accepted - Get all accepted study partners
router.get('/accepted', getAcceptedPartners);

// GET /api/partners/search - Search for potential study partners
router.get('/search', searchStudyPartners);

// POST /api/partners/request - Send a partnership request
router.post('/request', sendPartnershipRequest);

// PUT /api/partners/:partnershipId/respond - Accept or decline a partnership request
router.put('/:partnershipId/respond', respondToPartnershipRequest);

// DELETE /api/partners/:partnershipId - Remove or block a partnership
router.delete('/:partnershipId', removePartnership);

module.exports = router;