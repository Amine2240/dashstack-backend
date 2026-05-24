const express = require("express");
const router = express.Router();
const predictiveMaintenanceController = require("../controllers/predictiveMaintenanceController");
const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * Training and Model Management
 */

// Train the model (admin only, should be scheduled)
router.post(
  "/train",
  authenticateToken,
  predictiveMaintenanceController.trainModel
);

// Get model performance metrics
router.get(
  "/model-metrics",
  authenticateToken,
  predictiveMaintenanceController.getModelMetrics
);

/**
 * Predictions
 */

// Get latest prediction for a machine
router.get(
  "/prediction/:machineId",
  authenticateToken,
  predictiveMaintenanceController.getLatestPrediction
);

// Make a prediction for a machine
router.post(
  "/predict/:machine_id",
  authenticateToken,
  predictiveMaintenanceController.predictMaintenance
);

// Get prediction history for a machine
router.get(
  "/history/:machineId",
  authenticateToken,
  predictiveMaintenanceController.getPredictionHistory
);

// Get maintenance recommendations for all machines
router.get(
  "/all-recommendations",
  authenticateToken,
  predictiveMaintenanceController.getAllRecommendations
);

// Batch prediction for multiple machines
router.post(
  "/batch-predict",
  authenticateToken,
  predictiveMaintenanceController.batchPredict
);

/**
 * Maintenance Records
 */

// Record completed maintenance
router.post(
  "/record/:machine_id",
  authenticateToken,
  predictiveMaintenanceController.recordMaintenance
);

// Get all maintenance history
router.get(
  "/maintenance-history",
  authenticateToken,
  predictiveMaintenanceController.getAllMaintenanceHistory
);

/**
 * Dashboard and Analytics
 */

// Get dashboard summary
router.get(
  "/dashboard/summary",
  authenticateToken,
  predictiveMaintenanceController.getDashboardSummary
);

/**
 * Admin Operations
 */

// Clear predictions for a machine (admin only)
router.delete(
  "/predictions/:machineId",
  authenticateToken,
  predictiveMaintenanceController.clearPredictions
);

/**
 * TEST ENDPOINT - Remove in production
 */
// Test endpoint without auth to verify system works
router.get(
  "/test/summary",
  predictiveMaintenanceController.getDashboardSummary
);
router.post(
  "/test/predict/:machine_id",
  predictiveMaintenanceController.predictMaintenance
);

module.exports = router;
