const admin = require('../config/firebase-messaging-sw');

const sendNotification = async (token, message) => {
    console.log('Sending notification to:', token);
    try {
      const response = await admin.messaging().send({
        token: token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data || {}, // Optional custom data
      });
      console.log('Notification sent:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

    module.exports = sendNotification;