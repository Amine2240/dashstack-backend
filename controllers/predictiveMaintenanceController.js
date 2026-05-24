const predictiveMaintenanceService = require("../services/predictiveMaintenanceService");
const {
  MaintenancePrediction,
  ModelMetrics,
  MaintenanceHistory,
} = require("../models/PredictiveMaintenance");

/**
 * POST /api/maintenance/train
 * Train the predictive maintenance model (should be called periodically)
 */
exports.trainModel = async (req, res) => {
  try {
    console.log("Starting model training...");

    const output = await predictiveMaintenanceService.trainModel();

    res.status(200).json({
      message: "Model training started successfully",
      output: output.slice(-500), // Last 500 chars
    });
  } catch (error) {
    console.error("Error training model:", error);
    res.status(500).json({
      error: "Model training failed",
      details: error.message,
    });
  }
};

/**
 * POST /api/maintenance/predict
 * Make a maintenance prediction for a specific machine
 */
exports.predictMaintenance = async (req, res) => {
  try {
    const { machine_id } = req.params;
    const machineData = req.body;

    if (!machine_id) {
      return res.status(400).json({ error: "machine_id is required" });
    }

    machineData.machine_id = machine_id;

    const prediction = await predictiveMaintenanceService.predictMaintenance(
      machineData
    );

    res.status(200).json({
      success: true,
      data: prediction,
      urgency: prediction.maintenance_urgency,
      recommendation: prediction.recommendation,
    });
  } catch (error) {
    console.error("Error in predictMaintenance:", error);
    res.status(500).json({
      error: "Prediction failed",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/prediction/:machineId
 * Get the latest prediction for a machine
 */
exports.getLatestPrediction = async (req, res) => {
  try {
    const { machineId } = req.params;

    const prediction = await MaintenancePrediction.findOne({
      machine_id: machineId,
    }).sort({ prediction_date: -1 });

    if (!prediction) {
      return res.status(404).json({
        error: "No predictions found for this machine",
      });
    }

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Error fetching latest prediction:", error);
    res.status(500).json({
      error: "Failed to fetch prediction",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/history/:machineId
 * Get prediction history for a machine
 */
exports.getPredictionHistory = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { limit = 50 } = req.query;

    const history = await predictiveMaintenanceService.getPredictionHistory(
      machineId,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching prediction history:", error);
    res.status(500).json({
      error: "Failed to fetch history",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/all-recommendations
 * Get maintenance recommendations for all machines
 */
exports.getAllRecommendations = async (req, res) => {
  try {
    const recommendations =
      await predictiveMaintenanceService.getAllMaintenanceRecommendations();

    const criticalCount = recommendations.filter(
      (r) => r.maintenance_urgency === "critical"
    ).length;
    const highCount = recommendations.filter(
      (r) => r.maintenance_urgency === "high"
    ).length;

    res.status(200).json({
      success: true,
      count: recommendations.length,
      critical_count: criticalCount,
      high_count: highCount,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error fetching all recommendations:", error);
    res.status(500).json({
      error: "Failed to fetch recommendations",
      details: error.message,
    });
  }
};

/**
 * POST /api/maintenance/record
 * Record completed maintenance action
 */
exports.recordMaintenance = async (req, res) => {
  try {
    const { machine_id } = req.params;
    const maintenanceData = req.body;

    if (!machine_id) {
      return res.status(400).json({ error: "machine_id is required" });
    }

    const maintenance = await predictiveMaintenanceService.recordMaintenance(
      machine_id,
      maintenanceData
    );

    res.status(201).json({
      success: true,
      message: "Maintenance recorded successfully",
      data: maintenance,
    });
  } catch (error) {
    console.error("Error recording maintenance:", error);
    res.status(500).json({
      error: "Failed to record maintenance",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/history
 * Get all maintenance history
 */
exports.getAllMaintenanceHistory = async (req, res) => {
  try {
    const { limit = 100, machine_id } = req.query;

    const query = machine_id ? { machine_id } : {};

    const history = await MaintenanceHistory.find(query)
      .sort({ maintenance_date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching maintenance history:", error);
    res.status(500).json({
      error: "Failed to fetch maintenance history",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/model-metrics
 * Get current model performance metrics
 */
exports.getModelMetrics = async (req, res) => {
  try {
    const metrics = await ModelMetrics.findOne({ is_active: true }).sort({
      training_date: -1,
    });

    if (!metrics) {
      return res.status(404).json({
        error: "No trained model found",
      });
    }

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching model metrics:", error);
    res.status(500).json({
      error: "Failed to fetch model metrics",
      details: error.message,
    });
  }
};

/**
 * GET /api/maintenance/dashboard-summary
 * Get maintenance dashboard summary
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get critical and high priority predictions
    const predictions = await MaintenancePrediction.aggregate([
      {
        $sort: { prediction_date: -1 },
      },
      {
        $group: {
          _id: "$machine_id",
          latest: { $first: "$$ROOT" },
        },
      },
    ]);

    const critical = predictions.filter(
      (p) => p.latest.maintenance_urgency === "critical"
    ).length;
    const high = predictions.filter(
      (p) => p.latest.maintenance_urgency === "high"
    ).length;

    // Get recent maintenance activities
    const recentMaintenance = await MaintenanceHistory.find()
      .sort({ maintenance_date: -1 })
      .limit(10);

    // Get model performance
    const modelMetrics = await ModelMetrics.findOne({ is_active: true }).sort({
      training_date: -1,
    });

    // Calculate average failure probability
    const avgFailureProbability =
      predictions.length > 0
        ? predictions.reduce(
            (sum, p) => sum + p.latest.failure_probability,
            0
          ) / predictions.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        total_machines_monitored: predictions.length,
        critical_maintenance_needed: critical,
        high_priority_maintenance: high,
        average_failure_probability: avgFailureProbability.toFixed(3),
        model_accuracy: modelMetrics ? modelMetrics.accuracy.toFixed(3) : "N/A",
        recent_maintenance_activities: recentMaintenance,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard summary",
      details: error.message,
    });
  }
};

/**
 * POST /api/maintenance/batch-predict
 * Make predictions for multiple machines
 */
exports.batchPredict = async (req, res) => {
  try {
    const { machines } = req.body;

    if (!Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({
        error: "machines array is required and must not be empty",
      });
    }

    const predictions = [];
    const errors = [];

    for (const machine of machines) {
      try {
        const prediction =
          await predictiveMaintenanceService.predictMaintenance(machine);
        predictions.push(prediction);
      } catch (error) {
        errors.push({
          machine_id: machine.machine_id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      total_processed: machines.length,
      successful: predictions.length,
      failed: errors.length,
      predictions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in batch prediction:", error);
    res.status(500).json({
      error: "Batch prediction failed",
      details: error.message,
    });
  }
};

/**
 * DELETE /api/maintenance/predictions/:machineId
 * Clear predictions for a machine (for testing/maintenance)
 */
exports.clearPredictions = async (req, res) => {
  try {
    const { machineId } = req.params;

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "Only admins can clear predictions",
      });
    }

    const result = await MaintenancePrediction.deleteMany({
      machine_id: machineId,
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} predictions for ${machineId}`,
    });
  } catch (error) {
    console.error("Error clearing predictions:", error);
    res.status(500).json({
      error: "Failed to clear predictions",
      details: error.message,
    });
  }
};
