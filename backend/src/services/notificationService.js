const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
    })
  });
}

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Nodemailer
const emailTransporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class NotificationService {
  // Send emergency alert to contact
  async sendEmergencyAlert({ contact, user, emergency, location }) {
    const message = `🚨 EMERGENCY ALERT 🚨\n\n${user.name} has triggered an emergency alert.\n\nType: ${emergency.type}\nLocation: ${location.address || `${location.latitude}, ${location.longitude}`}\nTime: ${new Date().toLocaleString()}\n\nPlease check on them immediately or contact emergency services if needed.`;

    const results = [];

    // Send SMS if enabled
    if (contact.notificationPreferences.sms) {
      try {
        const smsResult = await this.sendSMS(contact.phone, message);
        results.push({ method: 'SMS', success: smsResult.success });
      } catch (error) {
        logger.error(`SMS notification failed for contact ${contact._id}:`, error);
        results.push({ method: 'SMS', success: false });
      }
    }

    // Send Email if enabled
    if (contact.notificationPreferences.email && contact.email) {
      try {
        const emailResult = await this.sendEmail({
          to: contact.email,
          subject: `🚨 Emergency Alert from ${user.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
                <h1>🚨 EMERGENCY ALERT 🚨</h1>
              </div>
              <div style="padding: 20px; background-color: #f9fafb;">
                <p><strong>${user.name}</strong> has triggered an emergency alert.</p>
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Type:</strong> ${emergency.type}</p>
                  <p><strong>Location:</strong> ${location.address || `${location.latitude}, ${location.longitude}`}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0;">
                  <p><strong>Action Required:</strong> Please check on them immediately or contact emergency services if needed.</p>
                </div>
                <p style="color: #6b7280; font-size: 12px;">This is an automated emergency notification from SafePath.</p>
              </div>
            </div>
          `
        });
        results.push({ method: 'Email', success: emailResult.success });
      } catch (error) {
        logger.error(`Email notification failed for contact ${contact._id}:`, error);
        results.push({ method: 'Email', success: false });
      }
    }

    // Return the first successful method or the first attempt
    return results.find(r => r.success) || results[0] || { method: 'SMS', success: false };
  }

  // Send status update to contact
  async sendStatusUpdate({ contact, message, emergency }) {
    try {
      if (contact.notificationPreferences.sms) {
        await this.sendSMS(contact.phone, message);
      }

      if (contact.notificationPreferences.email && contact.email) {
        await this.sendEmail({
          to: contact.email,
          subject: 'Emergency Status Update',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
                <h1>Emergency Status Update</h1>
              </div>
              <div style="padding: 20px; background-color: #f9fafb;">
                <p>${message}</p>
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification from SafePath.</p>
              </div>
            </div>
          `
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Status update notification failed:', error);
      return { success: false };
    }
  }

  // Send SMS
  async sendSMS(to, message) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      logger.info(`SMS sent successfully to ${to}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error(`SMS sending failed to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send Email
  async sendEmail({ to, subject, html, text }) {
    try {
      const result = await emailTransporter.sendMail({
        from: `"SafePath Emergency" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Email sending failed to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification
  async sendPushNotification({ tokens, title, body, data = {} }) {
    try {
      const message = {
        notification: {
          title,
          body
        },
        data,
        tokens: Array.isArray(tokens) ? tokens : [tokens]
      };

      const response = await admin.messaging().sendMulticast(message);
      
      logger.info(`Push notifications sent: ${response.successCount}/${tokens.length}`);
      
      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Push notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send test notification
  async sendTestNotification(contact, user) {
    const message = `This is a test message from SafePath. ${user.name} is testing their emergency contact system. No action is required.`;

    try {
      const result = await this.sendSMS(contact.phone, message);
      
      if (contact.email) {
        await this.sendEmail({
          to: contact.email,
          subject: 'SafePath Test Notification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                <h1>SafePath Test Notification</h1>
              </div>
              <div style="padding: 20px; background-color: #f9fafb;">
                <p>This is a test message from SafePath.</p>
                <p><strong>${user.name}</strong> is testing their emergency contact system.</p>
                <p><strong>No action is required.</strong></p>
                <p style="color: #6b7280; font-size: 12px;">This is a test notification from SafePath.</p>
              </div>
            </div>
          `
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Test notification failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();