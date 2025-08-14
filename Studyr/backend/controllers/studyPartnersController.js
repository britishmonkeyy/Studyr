/*
Module Name: Study Partners Controller
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Handles study partnership management including partner requests, responses, search functionality, and partnership status management between users
*/
const { StudyPartner, User, Subject } = require('../models');
const { Op } = require('sequelize');

// Get all partnerships for the authenticated user
const getPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get both sent and received requests
    const [sentRequests, receivedRequests] = await Promise.all([
      StudyPartner.findAll({
        where: { requesterId: userId },
        include: [
          {
            model: User,
            as: 'recipient',
            attributes: ['userId', 'firstName', 'lastName', 'username', 'studyLevel'],
            include: [
              {
                model: Subject,
                as: 'subjects',
                attributes: ['subjectName', 'category', 'colorHex', 'iconEmoji']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      }),
      StudyPartner.findAll({
        where: { recipientId: userId },
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['userId', 'firstName', 'lastName', 'username', 'studyLevel'],
            include: [
              {
                model: Subject,
                as: 'subjects',
                attributes: ['subjectName', 'category', 'colorHex', 'iconEmoji']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        sentRequests,
        receivedRequests,
        totalSent: sentRequests.length,
        totalReceived: receivedRequests.length,
        pendingReceived: receivedRequests.filter(r => r.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Error fetching partnership requests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get accepted study partners
const getAcceptedPartners = async (req, res) => {
  try {
    const userId = req.user.userId;

    const partnerships = await StudyPartner.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId },
          { recipientId: userId }
        ],
        status: 'accepted'
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'studyLevel', 'lastLogin'],
          include: [
            {
              model: Subject,
              as: 'subjects',
              attributes: ['subjectName', 'category', 'colorHex', 'iconEmoji']
            }
          ]
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'firstName', 'lastName', 'username', 'studyLevel', 'lastLogin'],
          include: [
            {
              model: Subject,
              as: 'subjects',
              attributes: ['subjectName', 'category', 'colorHex', 'iconEmoji']
            }
          ]
        }
      ],
      order: [['matchedAt', 'DESC']]
    });

    // Format the response to show the "other" user in each partnership
    const partners = partnerships.map(partnership => {
      const isRequester = partnership.requesterId === userId;
      const partner = isRequester ? partnership.recipient : partnership.requester;
      
      return {
        partnershipId: partnership.partnershipId,
        partnerId: partner.userId,
        firstName: partner.firstName,
        lastName: partner.lastName,
        username: partner.username,
        studyLevel: partner.studyLevel,
        lastLogin: partner.lastLogin,
        subjects: partner.subjects,
        matchedAt: partnership.matchedAt,
        isOnline: partner.lastLogin && new Date() - new Date(partner.lastLogin) < 15 * 60 * 1000 // Online if active in last 15 minutes
      };
    });

    res.json({
      success: true,
      data: { partners }
    });
  } catch (error) {
    console.error('Error fetching accepted partners:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send partnership request
const sendPartnershipRequest = async (req, res) => {
  try {
    const { recipientId, requestMessage } = req.body;
    const requesterId = req.user.userId;

    // Validate recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if partnership already exists
    const existingPartnership = await StudyPartner.findOne({
      where: {
        [Op.or]: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId }
        ]
      }
    });

    if (existingPartnership) {
      return res.status(400).json({
        success: false,
        message: 'Partnership request already exists'
      });
    }

    // Can't send request to yourself
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send partnership request to yourself'
      });
    }

    // Create partnership request
    const partnership = await StudyPartner.create({
      requesterId,
      recipientId,
      requestMessage: requestMessage || null,
      status: 'pending'
    });

    // Get the created partnership with user details
    const createdPartnership = await StudyPartner.findByPk(partnership.partnershipId, {
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'firstName', 'lastName', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Partnership request sent successfully',
      data: { partnership: createdPartnership }
    });
  } catch (error) {
    console.error('Error sending partnership request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Respond to partnership request (accept/decline)
const respondToPartnershipRequest = async (req, res) => {
  try {
    const { partnershipId } = req.params;
    const { response } = req.body; // 'accepted' or 'declined'
    const userId = req.user.userId;

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response. Must be "accepted" or "declined"'
      });
    }

    // Find the partnership request
    const partnership = await StudyPartner.findOne({
      where: {
        partnershipId,
        recipientId: userId, // Only recipient can respond
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['userId', 'firstName', 'lastName', 'username']
        }
      ]
    });

    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found or already responded to'
      });
    }

    // Update the partnership status
    partnership.status = response;
    if (response === 'accepted') {
      partnership.matchedAt = new Date();
    }
    await partnership.save();

    res.json({
      success: true,
      message: `Partnership request ${response} successfully`,
      data: { partnership }
    });
  } catch (error) {
    console.error('Error responding to partnership request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search for potential study partners
const searchStudyPartners = async (req, res) => {
  try {
    const { q, studyLevel, subject } = req.query;
    const userId = req.user.userId;

    let whereClause = {
      userId: { [Op.ne]: userId }, // Exclude current user
      isActive: true
    };

    // Add study level filter
    if (studyLevel) {
      whereClause.studyLevel = studyLevel;
    }

    // Build search query
    if (q) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { username: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Get users with subjects
    let usersQuery = {
      where: whereClause,
      attributes: ['userId', 'firstName', 'lastName', 'username', 'studyLevel', 'lastLogin'],
      include: [
        {
          model: Subject,
          as: 'subjects',
          attributes: ['subjectName', 'category', 'colorHex', 'iconEmoji']
        }
      ],
      limit: 20,
      order: [['lastLogin', 'DESC']]
    };

    // Add subject filter if specified
    if (subject) {
      usersQuery.include[0].where = {
        [Op.or]: [
          { subjectName: { [Op.iLike]: `%${subject}%` } },
          { category: { [Op.iLike]: `%${subject}%` } }
        ]
      };
    }

    const users = await User.findAll(usersQuery);

    // Get existing partnerships to exclude users we already have relationships with
    const existingPartnerships = await StudyPartner.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId },
          { recipientId: userId }
        ]
      },
      attributes: ['requesterId', 'recipientId', 'status']
    });

    const excludeUserIds = existingPartnerships.map(p => 
      p.requesterId === userId ? p.recipientId : p.requesterId
    );

    // Filter out users we already have partnerships with
    const availableUsers = users.filter(user => !excludeUserIds.includes(user.userId));

    // Add online status
    const usersWithStatus = availableUsers.map(user => ({
      ...user.toJSON(),
      isOnline: user.lastLogin && new Date() - new Date(user.lastLogin) < 15 * 60 * 1000
    }));

    res.json({
      success: true,
      data: { 
        users: usersWithStatus,
        total: usersWithStatus.length 
      }
    });
  } catch (error) {
    console.error('Error searching study partners:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove/block partnership
const removePartnership = async (req, res) => {
  try {
    const { partnershipId } = req.params;
    const { action = 'remove' } = req.body; // 'remove' or 'block'
    const userId = req.user.userId;

    const partnership = await StudyPartner.findOne({
      where: {
        partnershipId,
        [Op.or]: [
          { requesterId: userId },
          { recipientId: userId }
        ]
      }
    });

    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership not found'
      });
    }

    if (action === 'block') {
      partnership.status = 'blocked';
      await partnership.save();
    } else {
      await partnership.destroy();
    }

    res.json({
      success: true,
      message: `Partnership ${action === 'block' ? 'blocked' : 'removed'} successfully`
    });
  } catch (error) {
    console.error('Error removing partnership:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPartnershipRequests,
  getAcceptedPartners,
  sendPartnershipRequest,
  respondToPartnershipRequest,
  searchStudyPartners,
  removePartnership
};