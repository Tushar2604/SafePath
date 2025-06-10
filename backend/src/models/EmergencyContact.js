const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    enum: ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Other']
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationPreferences: {
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    call: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Ensure only one primary contact per user
emergencyContactSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);