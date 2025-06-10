const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SOS', 'Medical', 'Fire', 'Police', 'Natural Disaster', 'Other'],
    default: 'SOS'
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Cancelled', 'False Alarm'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String,
    accuracy: Number
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  contactsNotified: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact'
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['SMS', 'Email', 'Push', 'Call']
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed', 'Acknowledged'],
      default: 'Sent'
    }
  }],
  emergencyServicesContacted: {
    type: Boolean,
    default: false
  },
  emergencyServicesContactedAt: Date,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    accuracy: Number
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
emergencySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
emergencySchema.index({ user: 1, status: 1 });
emergencySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);