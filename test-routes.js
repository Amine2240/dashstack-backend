// Quick test to debug route loading issue
const express = require("express");
const router = express.Router();

console.log("Loading controller...");
const predictiveMaintenanceController = require("./controllers/predictiveMaintenanceController");

console.log(
  "Controller exports:",
  Object.keys(predictiveMaintenanceController)
);
console.log(
  "trainModel type:",
  typeof predictiveMaintenanceController.trainModel
);

console.log("\nAttempting to create route...");
try {
  router.post("/train", predictiveMaintenanceController.trainModel);
  console.log("✅ Route created successfully!");
} catch (error) {
  console.log("❌ Error creating route:", error.message);
}
