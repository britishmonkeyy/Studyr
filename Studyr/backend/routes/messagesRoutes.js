const router = require('express').Router();
const { Message, User } = require('../models');
const auth = require('../middleware/auth');

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get unique conversations
    const conversations = await sequelize.query(`
      SELECT DISTINCT ON (other_user_id) 
        CASE 
          WHEN sender_id = :userId THEN recipient_id 
          ELSE sender_id 
        END as other_user_id,
        m.*,
        u.username,
        u.profile_picture_url
      FROM messages m
      JOIN users u ON u.user_id = CASE 
        WHEN m.sender_id = :userId THEN m.recipient_id 
        ELSE m.sender_id 
      END
      WHERE :userId IN (sender_id, recipient_id)
      ORDER BY other_user_id, created_at DESC
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages with specific user
router.get('/messages/:partnerId', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.userId;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId }
        ]
      },
      order: [['createdAt', 'ASC']],
      include: [{
        model: User,
        as: 'sender',
        attributes: ['username', 'profilePictureUrl']
      }]
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          senderId: partnerId,
          recipientId: userId,
          isRead: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/messages', auth, async (req, res) => {
  try {
    const { recipientId, messageText } = req.body;
    
    const message = await Message.create({
      senderId: req.user.userId,
      recipientId,
      messageText
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;