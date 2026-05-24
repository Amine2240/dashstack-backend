const mongoose = require("mongoose");

// Schema for storing maintenance predictions
const maintenancePredictionSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true,
  },
  prediction_date: {
    type: Date,
    default: Date.now,
  },
  failure_probability: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  maintenance_urgency: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
  predicted_failure_date: {
    type: Date,
  },
  affected_parameters: [
    {
      parameter_name: String,
      current_value: Number,
      anomaly_score: Number,
    },
  ],
  recommendation: String,
  model_version: String,
  confidence_score: Number,
  action_taken: {
    type: String,
    enum: ["notification_sent", "alert_created", "maintenance_scheduled"],
    default: "notification_sent",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
  },
});

// Index for TTL (auto-delete old predictions after 7 days)
maintenancePredictionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Schema for storing model metrics
const modelMetricsSchema = new mongoose.Schema({
  model_version: {
    type: String,
    required: true,
    unique: true,
  },
  machine_type: String,
  accuracy: Number,
  precision: Number,
  recall: Number,
  f1_score: Number,
  auc_score: Number,
  training_date: {
    type: Date,
    default: Date.now,
  },
  training_samples: Number,
  model_path: String,
  is_active: {
    type: Boolean,
    default: false,
  },
  performance_history: [
    {
      test_date: Date,
      accuracy: Number,
      predictions_made: Number,
    },
  ],
});

// Schema for maintenance history
const maintenanceHistorySchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true,
  },
  maintenance_date: {
    type: Date,
    default: Date.now,
  },
  maintenance_type: {
    type: String,
    enum: ["preventive", "predictive", "corrective"],
    required: true,
  },
  description: String,
  predicted_failure: Boolean,
  prediction_accuracy: {
    type: Boolean,
    comment: "Whether the prediction was accurate",
  },
  actions_performed: [String],
  parts_replaced: [String],
  duration_minutes: Number,
  technician_notes: String,
  next_maintenance_due: Date,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  MaintenancePrediction: mongoose.model(
    "MaintenancePrediction",
    maintenancePredictionSchema
  ),
  ModelMetrics: mongoose.model("ModelMetrics", modelMetricsSchema),
  MaintenanceHistory: mongoose.model(
    "MaintenanceHistory",
    maintenanceHistorySchema
  ),
};
