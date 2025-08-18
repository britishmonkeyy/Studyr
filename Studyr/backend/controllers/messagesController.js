/*
Module Name: Messages Controller
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Manages messaging functionality between study partners including conversation retrieval, message sending/receiving, read status tracking, and message statistics
*/
const { Message, User, StudyPartner } = require('../models');
const { Op } = require('sequelize');
const partnerSession = require('../models/partnerSession');
const { application } = require('express');

// Get conversations list
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get the latest message for each conversation
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'profilePictureUrl']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'profilePictureUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by conversation partner and get the latest message for each
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const partnerId = message.senderId === userId ? message.recipientId : message.senderId;
      const partner = message.senderId === userId ? message.recipient : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partner: {
            userId: partner.userId,
            firstName: partner.firstName,
            lastName: partner.lastName,
            username: partner.username,
            profilePictureUrl: partner.profilePictureUrl
          },
          lastMessage: {
            messageId: message.messageId,
            messageText: message.messageText,
            senderId: message.senderId,
            isRead: message.isRead,
            createdAt: message.createdAt,
            isFromMe: message.senderId === userId
          },
          unreadCount: 0
        });
      }
    });

    // Count unread messages for each conversation
    for (const [partnerId, conversation] of conversationMap) {
      const unreadCount = await Message.count({
        where: {
          senderId: partnerId,
          recipientId: userId,
          isRead: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    // Convert map to array and sort by last message time
    const conversationsList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json({
      success: true,
      data: { 
        conversations: conversationsList,
        totalUnread: conversationsList.reduce((sum, conv) => sum + conv.unreadCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get messages with a specific partner
const getMessagesWithPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    // Verify they are study partners
    const partnership = await StudyPartner.findOne({
      where: {
        [Op.or]: [
          { requesterId: userId, recipientId: partnerId },
          { requesterId: partnerId, recipientId: userId }
        ],
        status: 'accepted'
      }
    });

    if (!partnership) {
      return res.status(402).json({
        success: false,
        message: 'You can only message accepted study partners'
      });
    }

    // Get messages between the two users
    const offset = (page - 1) * limit;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'profilePictureUrl']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages from partner as read
    await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          senderId: partnerId,
          recipientId: userId,
          isRead: false
        }
      }
    );

    // Get partner info
    const partner = await User.findByPk(partnerId, {
      attributes: ['userId', 'firstName', 'lastName', 'username', 'profilePictureUrl', 'lastLogin']
    });

    res.json({
      success: true,
      data: {
        messages,
        partner,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, messageText, messageType = 'text' } = req.body;
    const senderId = req.user.userId;

    // Validate input
    if (!messageText || messageText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (messageText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 1000 characters)'
      });
    }
    // Verify recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Verify they are study partners (unless it's a system message)(system message not exist yet)
    if (messageType === 'text') {
      const partnership = await StudyPartner.findOne({
        where: {
          [Op.or]: [
            { requesterId: senderId, recipientId },
            { requesterId: recipientId, recipientId: senderId }
          ],
          status: 'accepted'
        }
      });

      if (!partnership) {
        return res.status(403).json({
          success: false,
          message: 'You can only message accepted study partners'
        });
      }
    }

    // Create message
    const message = await Message.create({
      senderId,
      recipientId,
      messageText: messageText.trim(),
      messageType,
      isRead: false
    });

    // Get the created message with sender details
    const messageWithSender = await Message.findByPk(message.messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'profilePictureUrl']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageWithSender }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.userId;

    // Mark all messages from this partner as read
    const [updatedCount] = await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          senderId: partnerId,
          recipientId: userId,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: `Marked ${updatedCount} messages as read`
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a message (soft delete by setting messageText to '[deleted]')
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({
      where: {
        messageId,
        senderId: userId // Only sender can delete
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you cannot delete this message'
      });
    }

    // Soft delete - replace content
    message.messageText = '[This message was deleted]';
    message.messageType = 'system';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get message statistics
const getMessageStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalSent, totalReceived, unreadCount] = await Promise.all([
      Message.count({ where: { senderId: userId } }),
      Message.count({ where: { recipientId: userId } }),
      Message.count({ 
        where: { 
          recipientId: userId, 
          isRead: false 
        } 
      })
    ]);

    // Get active conversations count
    const conversationsCount = await Message.count({
      distinct: true,
      col: 'senderId',
      where: {
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        totalSent,
        totalReceived,
        unreadCount,
        conversationsCount
      }
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getConversations,
  getMessagesWithPartner,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  getMessageStats
};