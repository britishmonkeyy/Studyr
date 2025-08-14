/*
Module Name: Study Session Controller
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Manages study session operations including creation, retrieval, updating, deletion, and completion tracking with automatic analytics integration
*/
const { StudySession, Subject, User } = require('../models');
const AnalyticsService = require('../services/analyticsService');

// Get all study sessions for the authenticated user
const getUserStudySessions = async (req, res) => {
  try {
    const sessions = await StudySession.findAll({
      where: { userId: req.user.userId },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectName', 'subjectCode', 'colorHex', 'iconEmoji']
        }
      ],
      order: [['startTime', 'DESC']]
    });

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new study session
const createStudySession = async (req, res) => {
  try {
    const { subjectId, sessionTitle, sessionType, startTime, endTime, location, notes } = req.body;

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    const session = await StudySession.create({
      userId: req.user.userId,
      subjectId,
      sessionTitle,
      sessionType: sessionType || 'solo',
      startTime,
      endTime,
      durationMinutes,
      location: location || 'online',
      notes
    });

    // Fetch the created session with subject details
    const sessionWithSubject = await StudySession.findByPk(session.sessionId, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectName', 'subjectCode', 'colorHex', 'iconEmoji']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Study session created successfully',
      data: { session: sessionWithSubject }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get specific study session
const getStudySessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await StudySession.findOne({
      where: { 
        sessionId: id,
        userId: req.user.userId // Ensure user can only access their own sessions
      },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectName', 'subjectCode', 'colorHex', 'iconEmoji']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update study session
const updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionTitle, sessionType, startTime, endTime, location, notes, status } = req.body;

    const session = await StudySession.findOne({
      where: { 
        sessionId: id,
        userId: req.user.userId 
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Update fields
    if (sessionTitle) session.sessionTitle = sessionTitle;
    if (sessionType) session.sessionType = sessionType;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (location !== undefined) session.location = location;
    if (notes !== undefined) session.notes = notes;
    if (status) session.status = status;

    // Recalculate duration if times changed
    if (startTime || endTime) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      session.durationMinutes = Math.round((end - start) / (1000 * 60));
    }

    await session.save();

    // Fetch updated session with subject details
    const updatedSession = await StudySession.findByPk(session.sessionId, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectName', 'subjectCode', 'colorHex', 'iconEmoji']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: { session: updatedSession }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete study session
const deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await StudySession.findOne({
      where: { 
        sessionId: id,
        userId: req.user.userId 
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await session.destroy();

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Replace your existing completeStudySession function with this:
const completeStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { productivityRating, actualEndTime } = req.body;
    
    const session = await StudySession.findOne({
      where: { 
        sessionId: id,
        userId: req.user.userId 
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Update session status and optional fields
    session.status = 'completed';
    if (actualEndTime) {
      session.endTime = actualEndTime;
      // Recalculate duration
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      session.durationMinutes = Math.round((end - start) / (1000 * 60));
    }
    if (productivityRating) {
      session.productivityRating = productivityRating;
    }

    await session.save();

    // Update analytics automatically
    try {
      await AnalyticsService.updateAnalyticsForCompletedSession(req.user.userId, session.sessionId);
      console.log('Analytics updated successfully for session:', session.sessionId); // Debug Statement
    } catch (analyticsError) {
      console.error('Analytics update failed:', analyticsError); // Debug Statement
      // Continue even if analytics fails - don't break the session completion
    }

    // Fetch updated session with subject details
    const completedSession = await StudySession.findByPk(session.sessionId, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectName', 'subjectCode', 'colorHex', 'iconEmoji']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Study session marked as completed',
      data: { session: completedSession }
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserStudySessions,
  createStudySession,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
  completeStudySession
};