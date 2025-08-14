/*
Module Name: Subject Controller
Module Author: Adam Bolton
Date Modified: 8/08/2025
Description: Handles subject CRUD operations and subject assigning to specific users
*/
const { Subject } = require('../models');

// Get all subjects for the authenticated user
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      where: { userId: req.user.userId }, // Only get user's subjects
      order: [['subjectName', 'ASC']]
    });

    res.json({
      success: true,
      data: { subjects }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new subject for the authenticated user
const createSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, category, colorHex, iconEmoji } = req.body;

    // Check if user already has a subject with this name
    const existingSubject = await Subject.findOne({
      where: { 
        userId: req.user.userId,
        subjectName: subjectName.trim()
      }
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'You already have a subject with this name'
      });
    }

    const subject = await Subject.create({
      userId: req.user.userId, // Associate with current user
      subjectName: subjectName.trim(),
      subjectCode: subjectCode?.trim() || null,
      category,
      colorHex,
      iconEmoji
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get subject by ID (only if owned by user)
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findOne({
      where: { 
        subjectId: id,
        userId: req.user.userId // Ensure user owns this subject
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: { subject }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update subject by ID (only if owned by user)
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, subjectCode, category, colorHex, iconEmoji } = req.body;

    const subject = await Subject.findOne({
      where: { 
        subjectId: id,
        userId: req.user.userId // Ensure user owns this subject
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if user is trying to rename to an existing subject name
    if (subjectName && subjectName.trim() !== subject.subjectName) {
      const existingSubject = await Subject.findOne({
        where: { 
          userId: req.user.userId,
          subjectName: subjectName.trim(),
          subjectId: { [require('sequelize').Op.ne]: id } // Exclude current subject
        }
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'You already have a subject with this name'
        });
      }
    }

    // Update subject
    await subject.update({
      subjectName: subjectName?.trim() || subject.subjectName,
      subjectCode: subjectCode?.trim() || subject.subjectCode,
      category: category || subject.category,
      colorHex: colorHex || subject.colorHex,
      iconEmoji: iconEmoji || subject.iconEmoji
    });

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete subject by ID (only if owned by user)
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findOne({
      where: { 
        subjectId: id,
        userId: req.user.userId // Ensure user owns this subject
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if subject has any study sessions
    const { StudySession } = require('../models');
    const sessionCount = await StudySession.count({
      where: { subjectId: id }
    });

    if (sessionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It has ${sessionCount} associated study session(s). Please delete or reassign the sessions first.`
      });
    }

    await subject.destroy();

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get subject statistics for the user
const getSubjectStats = async (req, res) => {
  try {
    const { StudySession } = require('../models');
    const { Op } = require('sequelize');

    const subjects = await Subject.findAll({
      where: { userId: req.user.userId },
      include: [
        {
          model: StudySession,
          as: 'studySessions',
          where: { status: 'completed' },
          required: false
        }
      ]
    });

    const stats = subjects.map(subject => {
      const sessions = subject.studySessions || [];
      const totalTime = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
      
      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        colorHex: subject.colorHex,
        iconEmoji: subject.iconEmoji,
        category: subject.category,
        totalSessions: sessions.length,
        totalStudyTime: totalTime,
        averageSessionLength: sessions.length > 0 ? Math.round(totalTime / sessions.length) : 0
      };
    });

    res.json({
      success: true,
      data: { subjects: stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectStats
};