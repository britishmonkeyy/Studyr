const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getConversations,
  getMessagesWithPartner,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  getMessageStats
} = require('../controllers/messagesController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/messages/conversations - Get list of conversations
router.get('/conversations', getConversations);

// GET /api/messages/stats - Get message statistics
router.get('/stats', getMessageStats);

// GET /api/messages/:partnerId - Get messages with specific partner
router.get('/:partnerId', getMessagesWithPartner);

// POST /api/messages - Send a message
router.post('/', sendMessage);

// PUT /api/messages/:partnerId/read - Mark messages as read
router.put('/:partnerId/read', markMessagesAsRead);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', deleteMessage);

module.exports = router;