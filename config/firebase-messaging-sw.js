const admin = require("firebase-admin");
const serviceAccount = require("../devfest-32d78-firebase-adminsdk-bkjzy-d0e6175aa7.json");

// Initialize Firebase Admin
module.exports = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
