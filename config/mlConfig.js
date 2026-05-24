/**
 * ML Configuration for Predictive Maintenance
 */

module.exports = {
  // Model training configuration
  training: {
    test_size: 0.2,
    random_state: 42,
    cv_folds: 5,
  },

  // Random Forest parameters
  randomForest: {
    n_estimators: 200,
    max_depth: 20,
    min_samples_split: 10,
    min_samples_leaf: 5,
    class_weight: "balanced",
    random_state: 42,
    n_jobs: -1,
  },

  // Gradient Boosting parameters
  gradientBoosting: {
    n_estimators: 150,
    learning_rate: 0.1,
    max_depth: 7,
    min_samples_split: 10,
    min_samples_leaf: 5,
    random_state: 42,
  },

  // Feature engineering
  features: {
    rolling_windows: [5, 20],
    ema_span: 5,
    rolling_std_window: 5,
  },

  // Prediction thresholds
  thresholds: {
    temperature: 80,
    vibration: 5,
    pressure: 10,
    efficiency: 70,
    error_count: 10,
    power_consumption: 5000,
  },

  // Urgency levels
  urgency: {
    critical: 0.8,
    high: 0.6,
    medium: 0.4,
    low: 0,
  },

  // Predicted failure timeline (in days)
  failureTimeline: {
    critical: 1,
    high: 3,
    medium: 7,
    low: 30,
  },

  // Model management
  models: {
    max_versions_to_keep: 5,
    model_path: "ml_models/",
    auto_retrain_interval: "weekly", // daily, weekly, monthly
    min_accuracy_threshold: 0.85,
  },

  // Inference configuration
  inference: {
    timeout_ms: 10000,
    batch_size: 100,
    cache_predictions_ms: 60000, // 1 minute
  },

  // Notification settings
  notifications: {
    critical_urgency_recipients: ["admin", "manager", "supervisor"],
    high_urgency_recipients: ["manager", "supervisor"],
    medium_urgency_recipients: ["supervisor"],
    send_email: true,
    send_push: true,
    send_sms: false,
  },

  // Data retention
  retention: {
    predictions_ttl_days: 7,
    maintenance_history_ttl_days: 365,
    model_metrics_ttl_days: 90,
  },

  // Performance monitoring
  monitoring: {
    track_prediction_latency: true,
    track_accuracy_drift: true,
    alert_on_low_accuracy: true,
    low_accuracy_threshold: 0.8,
  },
};
