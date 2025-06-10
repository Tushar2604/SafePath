const express = require('express');
const { body, validationResult } = require('express-validator');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get user's emergency contacts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ 
      user: req.user.id,
      isActive: true 
    }).sort({ isPrimary: -1, createdAt: -1 });

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
});

// @route   POST /api/contacts
// @desc    Add emergency contact
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('relationship').isIn(['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Other']).withMessage('Invalid relationship'),
  body('isPrimary').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, phone, email, relationship, isPrimary = false, notificationPreferences } = req.body;

    // Check if contact limit reached (max 10 contacts)
    const contactCount = await EmergencyContact.countDocuments({ 
      user: req.user.id,
      isActive: true 
    });

    if (contactCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 10 emergency contacts allowed'
      });
    }

    // Check for duplicate phone number
    const existingContact = await EmergencyContact.findOne({
      user: req.user.id,
      phone,
      isActive: true
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }

    const contact = new EmergencyContact({
      user: req.user.id,
      name,
      phone,
      email,
      relationship,
      isPrimary,
      notificationPreferences: {
        sms: true,
        email: !!email,
        call: false,
        ...notificationPreferences
      }
    });

    await contact.save();

    // Update user's emergency contacts array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { emergencyContacts: contact._id }
    });

    logger.info(`Emergency contact added by user ${req.user.id}: ${contact._id}`);

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      contact
    });
  } catch (error) {
    logger.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact'
    });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update emergency contact
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('relationship').optional().isIn(['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Other']).withMessage('Invalid relationship'),
  body('isPrimary').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const contact = await EmergencyContact.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check for duplicate phone number if phone is being updated
    if (req.body.phone && req.body.phone !== contact.phone) {
      const existingContact = await EmergencyContact.findOne({
        user: req.user.id,
        phone: req.body.phone,
        isActive: true,
        _id: { $ne: contact._id }
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this phone number already exists'
        });
      }
    }

    // Update contact fields
    Object.keys(req.body).forEach(key => {
      if (key === 'notificationPreferences') {
        contact.notificationPreferences = {
          ...contact.notificationPreferences,
          ...req.body.notificationPreferences
        };
      } else {
        contact[key] = req.body[key];
      }
    });

    await contact.save();

    logger.info(`Emergency contact updated by user ${req.user.id}: ${contact._id}`);

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      contact
    });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact'
    });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete emergency contact
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Soft delete
    contact.isActive = false;
    await contact.save();

    // Remove from user's emergency contacts array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { emergencyContacts: contact._id }
    });

    logger.info(`Emergency contact deleted by user ${req.user.id}: ${contact._id}`);

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact'
    });
  }
});

// @route   POST /api/contacts/:id/test
// @desc    Send test notification to contact
// @access  Private
router.post('/:id/test', auth, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const user = await User.findById(req.user.id);
    const result = await notificationService.sendTestNotification(contact, user);

    if (result.success) {
      logger.info(`Test notification sent by user ${req.user.id} to contact ${contact._id}`);
      
      res.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router;