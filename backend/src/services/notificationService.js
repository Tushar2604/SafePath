const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID ?? "safepath-e928d",
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ?? "0b745ecdd448d9466f26c8b28c0dfc643318fec3",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDqpARGJ+v0Lid\ns5SZhcrzCrG3pxCan4q8IalZp9ThgHPerKDQC1QXskry4im2zLu9pULrUpihg39u\nBSM+j3dAEfIvOXWZc6BuhJ3ew+5znQBNBon+qHeR5Y0PmSpcT6E/9BepbdunMpYi\nUV6s1QFcObnf0VsNL5EzKI+CD6M+Np6bRj2BmVr2QZ8rsZ03iXTE1NrBsSSbgGB1\n2AI7st2s00sb6j+dBJysZCHnydJccTMqn01bz7j4zkZbEAGqnBVoWwpRiJpqgOnw\nd7MHa3BR6cuaZ/UpkDjYGhhnmqaJe9KYgomAp2Ha8eA23OeTkcfU93p06C58FdIr\nbsR7f+y5AgMBAAECggEABxEJO2acfAVEMEwWfLQKvlvkvP+yEgqiXLpe8H6m/yCV\nKyeaPXBgojmRGSloh9I9hKiL9X/BC90kliP0eMqbbCmdUN+/7mxi2AWijRcPwj9i\ncWW1gUEzAE2wDBG5miYYv6c1zx1Xe/DP/Jv4mOsgdMhzmWmFjWuxQhv1H1BEYMzD\nI5G/m0RErMRokGXkX21GcrJ6jZq7q5SGjrOESz/O2nc3+IIJl0QnmYI/xQRtGvI0\nbhL/tmBuG2bkmKcXtCMHMer8MHy8p7vwvawvFg56ubFUGDsP9G6vjj67zcgLWG6f\nxP0ppXBbHrFPm7mPDNqYjMWa9HaqdGaWi7KJ6wJu2QKBgQDgOzqiuVzS38s1aZ7H\n5fb76bQ28nqQiv5oikX7gGIEwg+V61ZBEa92YGOn5nDQR+aBUUQ0idubLHOX9UNS\n3mVz035PnT6Z9c5/ItbK9UUnppjx9PCA9Tab0qDZ33YlFGAOKIwlHnSoCTz1fXwT\niGVhJo8hTuZCsFrW0JJCGOE7gwKBgQDfY0pOQ5+KERsOHtMUlMPOWj8BZNaKJu97\ngD6pDi2yVba6xX/8ev353jNv9ztPr568TFq8R5dJrkxO7jWhZbIf7cwiIxyep0A4\n4C4OTyBDN/bu3n9XarJaXfC37S3tAxBy7WwMX5P7/sAVtRgJpVN5kb2hiQzIKAJi\nb3yNzYPWEwKBgQCfv1Kcz3Yj/bAmE2M9gsYc3ni3lLRg+cUZ8Ti+Xs52GVNFOW4v\n2UuqCC23VmMU38SGaMEwtO4xdM+9eMxH441foVMhoSMSSJ6e0NE5stdb0kKwThJx\nrUEEbmCOF7dx3zw3mgeOAk6V0E8PjiCxQcEIH5Jk5nMBG+b7l4g7csIzxQKBgFdj\nml//qFv00Sa2/FBi2i7RszAyaJNnI+ymgNzVxR6s1W0/chAtdUnYmTrF9xf3VhvH\nqv9Y6mBSpVuDaMuY4xQGjQMVxU5zk3YsjRff8HkbXaiYtixWeytK8K6jRIIh3r93\nDfvRMC02vaJAVAUB/iPi1dJpsOxkanpjrtAyg86tAoGAIrdqPQ+lSO4Yh88vVu9i\nWAlRqViAE523T7WnkWeDHeMpD4rDSKXfyUUmvCHlsEnlBlGVg2CaPKky8nYpSh61\nGtbmQGMQRNNQ1Er8Pvz5PfWkm1gDstLKJ0fNXIwgSqm8z7Wq4KAGX79/pT8DKDwY\nq2HzFMNevwTPP/9dlxmiDS8=\n-----END PRIVATE KEY-----\n",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "firebase-adminsdk-fbsvc@safepath-e928d.iam.gserviceaccount.com",
      clientId: process.env.FIREBASE_CLIENT_ID ?? "106166107178783134768",
      authUri: process.env.FIREBASE_AUTH_URI ?? "https://accounts.google.com/o/oauth2/auth",
      tokenUri: process.env.FIREBASE_TOKEN_URI ?? "https://oauth2.googleapis.com/token",
    })
  });
}

// Initialize Twilio client with fallback
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized successfully');
  } else {
    logger.warn('Twilio credentials missing - SMS notifications will be disabled');
  }
} catch (err) {
  logger.warn('Twilio client initialization skipped:', err.message);
}

// Initialize Nodemailer
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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