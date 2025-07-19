const { Subject } = require('../models');

// Get all subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
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

// Create new subject
const createSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, category, colorHex, iconEmoji } = req.body;

    const subject = await Subject.create({
      subjectName,
      subjectCode,
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

// Get subject by ID
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

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

// Delete subject by ID
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
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

// Update subject by ID
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, subjectCode, category, colorHex, iconEmoji } = req.body;

    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Update subject
    await subject.update({
      subjectName,
      subjectCode,
      category,
      colorHex,
      iconEmoji
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

module.exports = {
  getAllSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject
};
