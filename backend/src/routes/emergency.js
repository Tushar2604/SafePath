const express = require('express');
const { body, validationResult } = require('express-validator');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const locationService = require('../services/locationService');
const logger = require('../utils/logger');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/emergency/trigger
// @desc    Trigger emergency alert
// @access  Private
router.post('/trigger', auth, [
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('type').optional().isIn(['SOS', 'Medical', 'Fire', 'Police', 'Natural Disaster', 'Other']),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
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

    const { location, type = 'SOS', description } = req.body;
    const user = await User.findById(req.user.id).populate('emergencyContacts');

    // Get address from coordinates
    const address = await locationService.getAddressFromCoordinates(
      location.latitude,
      location.longitude
    );

    // Create emergency record
    const emergency = new Emergency({
      user: req.user.id,
      type,
      location: {
        ...location,
        address
      },
      description,
      priority: type === 'Medical' ? 'Critical' : 'High'
    });

    await emergency.save();

    // Update user's last location
    user.lastLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date(),
      accuracy: location.accuracy
    };
    await user.save();

    // Notify emergency contacts
    const notificationPromises = user.emergencyContacts.map(async (contact) => {
      try {
        const notificationResult = await notificationService.sendEmergencyAlert({
          contact,
          user,
          emergency,
          location: { ...location, address }
        });

        emergency.contactsNotified.push({
          contact: contact._id,
          method: notificationResult.method,
          status: notificationResult.success ? 'Sent' : 'Failed'
        });

        return notificationResult;
      } catch (error) {
        logger.error(`Failed to notify contact ${contact._id}:`, error);
        emergency.contactsNotified.push({
          contact: contact._id,
          method: 'SMS',
          status: 'Failed'
        });
      }
    });

    await Promise.allSettled(notificationPromises);
    await emergency.save();

    // Emit real-time notification via Socket.IO
    req.io.emit('emergency-alert', {
      emergencyId: emergency._id,
      userId: req.user.id,
      userName: user.name,
      type,
      location: { ...location, address },
      timestamp: emergency.createdAt,
      emergencyContacts: user.emergencyContacts.map(c => c._id)
    });

    logger.info(`Emergency triggered by user ${req.user.id}: ${emergency._id}`);

    res.status(201).json({
      success: true,
      message: 'Emergency alert triggered successfully',
      emergency: {
        id: emergency._id,
        type: emergency.type,
        status: emergency.status,
        location: emergency.location,
        createdAt: emergency.createdAt,
        contactsNotified: emergency.contactsNotified.length
      }
    });
  } catch (error) {
    logger.error('Emergency trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger emergency alert'
    });
  }
});

// @route   PUT /api/emergency/:id/status
// @desc    Update emergency status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['Active', 'Resolved', 'Cancelled', 'False Alarm']).withMessage('Invalid status')
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

    const { status } = req.body;
    const emergency = await Emergency.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    emergency.status = status;
    if (status === 'Resolved' || status === 'Cancelled') {
      emergency.resolvedAt = new Date();
      emergency.resolvedBy = req.user.id;
    }

    await emergency.save();

    // Notify contacts about status update
    const user = await User.findById(req.user.id).populate('emergencyContacts');

    const statusMessage = `Emergency alert from ${user.name} has been ${status.toLowerCase()}`;

    user.emergencyContacts.forEach(async (contact) => {
      try {
        await notificationService.sendStatusUpdate({
          contact,
          message: statusMessage,
          emergency
        });
      } catch (error) {
        logger.error(`Failed to send status update to contact ${contact._id}:`, error);
      }
    });

    // Emit real-time status update
    req.io.emit('emergency-status-update', {
      emergencyId: emergency._id,
      status,
      resolvedAt: emergency.resolvedAt
    });

    logger.info(`Emergency ${emergency._id} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Emergency status updated successfully',
      emergency: {
        id: emergency._id,
        status: emergency.status,
        resolvedAt: emergency.resolvedAt
      }
    });
  } catch (error) {
    logger.error('Emergency status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency status'
    });
  }
});

// @route   POST /api/emergency/:id/location
// @desc    Update emergency location
// @access  Private
router.post('/:id/location', auth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
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

    const { latitude, longitude, accuracy } = req.body;
    const emergency = await Emergency.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'Active'
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Active emergency not found'
      });
    }

    // Add to location history
    emergency.locationHistory.push({
      latitude,
      longitude,
      accuracy,
      timestamp: new Date()
    });

    // Update current location
    emergency.location.latitude = latitude;
    emergency.location.longitude = longitude;
    emergency.location.accuracy = accuracy;

    await emergency.save();

    // Emit real-time location update
    req.io.to(`emergency-${emergency._id}`).emit('location-updated', {
      emergencyId: emergency._id,
      location: { latitude, longitude, accuracy },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    logger.error('Emergency location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// @route   GET /api/emergency/history
// @desc    Get user's emergency history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const emergencies = await Emergency.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contactsNotified.contact', 'name phone relationship');

    const total = await Emergency.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      emergencies,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Emergency history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency history'
    });
  }
});

// @route   GET /api/emergency/:id
// @desc    Get emergency details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const emergency = await Emergency.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('contactsNotified.contact', 'name phone relationship');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.json({
      success: true,
      emergency
    });
  } catch (error) {
    logger.error('Get emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency details'
    });
  }
});

// @route   POST /api/emergency/ai-assist
// @desc    Get AI-powered emergency guidance
// @access  Private
router.post('/ai-assist', auth, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Emergency description is required'
      });
    }

    logger.info('Processing AI assistance request:', { description });

    // Initialize Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct the prompt
    const prompt = `Given the following emergency situation: "${description}"

Please provide a structured response with:
1. First aid steps (numbered list)
2. Safety tips (bullet points)
3. What to do before emergency services arrive (bullet points)

Format the response as a JSON object with these keys:
{
  "firstAidSteps": ["step1", "step2", ...],
  "safetyTips": ["tip1", "tip2", ...],
  "beforeHelpArrives": ["action1", "action2", ...]
}

Keep each step/tip/action concise and clear. Focus on immediate actions that can be taken safely.`;

    logger.info('Sending prompt to Gemini AI');

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info('Received response from Gemini AI');

    try {
      // Parse the JSON response
      const aiResponse = JSON.parse(text);

      // Validate the response structure
      if (!aiResponse.firstAidSteps || !aiResponse.safetyTips || !aiResponse.beforeHelpArrives) {
        throw new Error('Invalid AI response structure');
      }

      logger.info('Successfully processed AI response');

      res.json({
        success: true,
        ...aiResponse
      });
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    logger.error('AI Assistance Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI assistance',
      details: error.message
    });
  }
});

module.exports = router;