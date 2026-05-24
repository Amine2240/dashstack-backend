const admin = require("firebase-admin");
const path = require("path");
const { format } = require("util");
//const serviceAccount = require("../firebase-config.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "devfest-32d78.appspot.com",
});

const bucket = admin.storage().bucket();

/**
 * Upload file to Firebase under a custom path.
 * @param {Object} file - The file object from multer.
 * @param {String} filePath - The custom directory path.
 */
const uploadFileToFirebase = async (file, filePath) => {
  return new Promise((resolve, reject) => {
    console.log(file); // Log the file object for debugging

    // Check if file and originalname exist
    if (!file || !file.originalname) {
      return reject(
        new Error("File object or originalname property is missing.")
      );
    }

    // Create a unique filename with the original extension
    const filename = `${Date.now()}${path.extname(file.originalname)}`;
    const firebaseFilePath = `${filePath}/${filename}`;

    // Reference to the Firebase file
    const firebaseFile = bucket.file(firebaseFilePath);

    // Create a write stream to Firebase
    const stream = firebaseFile.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    // Handle stream errors
    stream.on("error", (error) => reject(error));

    // On finish, make the file public and return its URL
    stream.on("finish", async () => {
      try {
        await firebaseFile.makePublic(); // Make the file publicly accessible
        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`
        );
        resolve(publicUrl); // Resolve the public URL
      } catch (error) {
        reject(new Error("Error making the file public: " + error.message));
      }
    });

    // Send the file buffer to Firebase
    stream.end(file.buffer);
  });
};

module.exports = {
  uploadFileToFirebase,
};

/**
 * Send Push Notification using Firebase Cloud Messaging (FCM).
 * @param {String} fcmToken - The FCM token of the user/device.
 * @param {String} title - Title of the notification.
 * @param {String} body - Body message of the notification.
 * @param {Object} [data] - Additional data to send with the notification (optional).
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data, // Optional additional data
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

module.exports = {
  uploadFileToFirebase,
  sendPushNotification,
};
