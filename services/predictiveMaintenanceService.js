const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const {
  MaintenancePrediction,
  ModelMetrics,
  MaintenanceHistory,
} = require("../models/PredictiveMaintenance");
const { sendPushNotification } = require("../services/firebaseService");
const User = require("../models/User");
const Notification = require("../models/Notification");

class PredictiveMaintenanceService {
  constructor() {
    this.modelPath = null;
    this.modelMetrics = null;
    this.pythonScriptPath = path.join(__dirname, "../ml_models/inference.py");
  }

  /**
   * Train the ML model using historical data
   */
  async trainModel() {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("py", [
        "-3.13",
        path.join(__dirname, "../ml_models/train_predictive_model.py"),
      ]);

      let output = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
        console.log("[ML Training]", data.toString().trim());
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
        console.error("[ML Training Error]", data.toString().trim());
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Model training completed successfully");
          resolve(output);
        } else {
          reject(new Error(`Training failed with exit code ${code}: ${error}`));
        }
      });

      // Timeout after 30 minutes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error("Model training timeout"));
      }, 30 * 60 * 1000);
    });
  }

  /**
   * Make predictions for a specific machine using current sensor data
   */
  async predictMaintenance(machineData) {
    try {
      // Validate input
      if (!machineData || !machineData.machine_id) {
        throw new Error("Invalid machine data: missing machine_id");
      }

      // Get latest model
      const model = await ModelMetrics.findOne({ is_active: true }).sort({
        training_date: -1,
      });

      if (!model) {
        console.warn("No trained model found. Using default thresholds.");
        return this.getDefaultPrediction(machineData);
      }

      // Prepare data for Python inference
      const inputData = {
        timestamp: new Date().toISOString(),
        machine_id: machineData.machine_id,
        features: this.extractFeatures(machineData),
      };

      // Call Python inference script
      const prediction = await this.runPythonInference(
        inputData,
        model.model_path
      );

      // Save prediction to database
      const maintenancePrediction = new MaintenancePrediction({
        machine_id: machineData.machine_id,
        failure_probability: prediction.failure_probability,
        maintenance_urgency: this.calculateUrgency(
          prediction.failure_probability
        ),
        predicted_failure_date: this.predictFailureDate(
          prediction.failure_probability
        ),
        affected_parameters: prediction.affected_parameters || [],
        recommendation: this.generateRecommendation(
          prediction.failure_probability,
          machineData.machine_id
        ),
        model_version: model._id.toString(),
        confidence_score: prediction.confidence_score || 0,
      });

      await maintenancePrediction.save();

      // Send notifications if urgency is high
      if (
        maintenancePrediction.maintenance_urgency === "high" ||
        maintenancePrediction.maintenance_urgency === "critical"
      ) {
        await this.notifyManagers(
          machineData.machine_id,
          maintenancePrediction
        );
      }

      return maintenancePrediction;
    } catch (error) {
      console.error("Error in predictMaintenance:", error);
      throw error;
    }
  }

  /**
   * Run Python inference script
   */
  async runPythonInference(inputData, modelPath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("py", [
        "-3.13",
        this.pythonScriptPath,
        JSON.stringify(inputData),
        modelPath,
      ]);

      let output = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
        console.error("[Inference Error]", data.toString().trim());
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const prediction = JSON.parse(output);
            resolve(prediction);
          } catch (e) {
            reject(new Error(`Failed to parse prediction output: ${output}`));
          }
        } else {
          reject(new Error(`Inference failed: ${error}`));
        }
      });

      // Timeout after 30 seconds (increased for model loading)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error("Inference timeout"));
      }, 30000);
    });
  }

  /**
   * Extract features from machine data for ML model
   */
  extractFeatures(machineData) {
    return {
      kpi_value: machineData.kpi_value || 0,
      temperature: machineData.temperature || 0,
      vibration: machineData.vibration || 0,
      pressure: machineData.pressure || 0,
      runtime_hours: machineData.runtime_hours || 0,
      error_count: machineData.error_count || 0,
      efficiency: machineData.efficiency || 100,
      power_consumption: machineData.power_consumption || 0,
    };
  }

  /**
   * Calculate maintenance urgency level
   */
  calculateUrgency(failureProbability) {
    if (failureProbability >= 0.8) return "critical";
    if (failureProbability >= 0.6) return "high";
    if (failureProbability >= 0.4) return "medium";
    return "low";
  }

  /**
   * Predict estimated failure date based on probability
   */
  predictFailureDate(failureProbability) {
    const now = new Date();

    if (failureProbability >= 0.8) {
      // Critical: within 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (failureProbability >= 0.6) {
      // High: within 3 days
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else if (failureProbability >= 0.4) {
      // Medium: within 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Low: within 30 days
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate actionable maintenance recommendations
   */
  generateRecommendation(failureProbability, machineId) {
    const urgency = this.calculateUrgency(failureProbability);

    const recommendations = {
      critical: `URGENT: ${machineId} requires immediate maintenance. High risk of imminent failure. Schedule maintenance within 24 hours.`,
      high: `${machineId} shows signs of degradation. Schedule preventive maintenance within 3 days to prevent potential failure.`,
      medium: `${machineId} should be monitored closely. Plan maintenance within the next 7 days.`,
      low: `${machineId} is operating normally. Continue regular monitoring and schedule routine maintenance as planned.`,
    };

    return recommendations[urgency] || recommendations.low;
  }

  /**
   * Notify managers of maintenance issues
   */
  async notifyManagers(machineId, prediction) {
    try {
      // Get all managers and supervisors
      const managers = await User.find({
        role: { $in: ["manager", "supervisor", "admin"] },
      });

      if (!managers.length) {
        console.warn("No managers found for notification");
        return;
      }

      const notificationMessage = `⚠️ Maintenance Alert: ${machineId} requires attention. Failure probability: ${(
        prediction.failure_probability * 100
      ).toFixed(1)}%`;

      // Send push notifications via Firebase
      for (const manager of managers) {
        try {
          if (manager.fcmTokens && manager.fcmTokens.length > 0) {
            await sendPushNotification(manager.fcmTokens, {
              title: "Predictive Maintenance Alert",
              body: notificationMessage,
              data: {
                machine_id: machineId,
                urgency: prediction.maintenance_urgency,
                failure_probability: prediction.failure_probability.toString(),
              },
            });
          }

          // Save notification to database
          const notification = new Notification({
            user_id: manager._id,
            message: notificationMessage,
            type: "maintenance_alert",
            machine_id: machineId,
            urgency: prediction.maintenance_urgency,
            read: false,
            created_at: new Date(),
          });
          await notification.save();
        } catch (error) {
          console.error(`Error notifying manager ${manager._id}:`, error);
        }
      }

      console.log(`Notifications sent to ${managers.length} managers`);
    } catch (error) {
      console.error("Error in notifyManagers:", error);
    }
  }

  /**
   * Get prediction history for a machine
   */
  async getPredictionHistory(machineId, limit = 100) {
    try {
      const predictions = await MaintenancePrediction.find({
        machine_id: machineId,
      })
        .sort({ prediction_date: -1 })
        .limit(limit);

      return predictions;
    } catch (error) {
      console.error("Error retrieving prediction history:", error);
      throw error;
    }
  }

  /**
   * Record maintenance action
   */
  async recordMaintenance(machineId, maintenanceData) {
    try {
      const maintenance = new MaintenanceHistory({
        machine_id: machineId,
        maintenance_type: maintenanceData.maintenance_type || "preventive",
        description: maintenanceData.description,
        predicted_failure: maintenanceData.predicted_failure || false,
        actions_performed: maintenanceData.actions_performed || [],
        parts_replaced: maintenanceData.parts_replaced || [],
        duration_minutes: maintenanceData.duration_minutes,
        technician_notes: maintenanceData.technician_notes,
        next_maintenance_due: maintenanceData.next_maintenance_due,
      });

      await maintenance.save();

      // Update prediction with feedback
      const latestPrediction = await MaintenancePrediction.findOne({
        machine_id: machineId,
      }).sort({ prediction_date: -1 });

      if (latestPrediction && maintenanceData.predicted_failure !== undefined) {
        latestPrediction.prediction_accuracy =
          maintenanceData.predicted_failure;
        await latestPrediction.save();
      }

      return maintenance;
    } catch (error) {
      console.error("Error recording maintenance:", error);
      throw error;
    }
  }

  /**
   * Get maintenance recommendations for all machines
   */
  async getAllMaintenanceRecommendations() {
    try {
      // Get latest prediction for each machine
      const predictions = await MaintenancePrediction.aggregate([
        {
          $sort: { prediction_date: -1 },
        },
        {
          $group: {
            _id: "$machine_id",
            latest_prediction: { $first: "$$ROOT" },
          },
        },
        {
          $sort: { "latest_prediction.maintenance_urgency": -1 },
        },
      ]);

      return predictions.map((p) => p.latest_prediction);
    } catch (error) {
      console.error("Error in getAllMaintenanceRecommendations:", error);
      throw error;
    }
  }

  /**
   * Fallback prediction using threshold-based logic
   */
  getDefaultPrediction(machineData) {
    const failureProbability = this.calculateFailureProbability(machineData);

    return {
      machine_id: machineData.machine_id,
      failure_probability: failureProbability,
      maintenance_urgency: this.calculateUrgency(failureProbability),
      recommendation: this.generateRecommendation(
        failureProbability,
        machineData.machine_id
      ),
      affected_parameters: [],
      confidence_score: 0.5,
    };
  }

  /**
   * Fallback: calculate failure probability from machine data
   */
  calculateFailureProbability(machineData) {
    let score = 0;

    // Temperature check (if provided)
    if (machineData.temperature > 80) score += 0.3;

    // Vibration check
    if (machineData.vibration > 5) score += 0.3;

    // Efficiency check
    if (machineData.efficiency < 70) score += 0.2;

    // Error count
    if (machineData.error_count > 10) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Save model metrics to database
   */
  async saveModelMetrics(metrics) {
    try {
      const modelMetric = new ModelMetrics({
        model_version: `v_${Date.now()}`,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1_score: metrics.f1_score,
        auc_score: metrics.auc_score,
        training_samples: metrics.training_samples || 0,
        model_path: metrics.model_path,
        is_active: true,
      });

      // Deactivate previous models
      await ModelMetrics.updateMany({ is_active: true }, { is_active: false });

      await modelMetric.save();
      return modelMetric;
    } catch (error) {
      console.error("Error saving model metrics:", error);
      throw error;
    }
  }
}

module.exports = new PredictiveMaintenanceService();
