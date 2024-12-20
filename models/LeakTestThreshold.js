// models/LeakTestThreshold.js
const mongoose = require("mongoose");

const leakTestSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: false,
    unique: true,
    default: "leak_test_005",
  },
  test_pressure: {
    worker: { type: Number, default: 8.5, required: false },
    manager: { type: Number, default: 9.5, required: false },
  },
  pressure_drop: {
    worker: { type: Number, default: 0.07, required: false },
    manager: { type: Number, default: 0.09, required: false },
  },
  leak_rate: {
    worker: { type: Number, default: 0.08, required: false },
    manager: { type: Number, default: 0.095, required: false },
  },
  test_duration: {
    worker: { type: Number, default: 40, required: false },
    manager: { type: Number, default: 60, required: false },
  },
  temperature: {
    worker: { type: Number, default: 24, required: false },
    manager: { type: Number, default: 30, required: false },
  },
  seal_condition: {
    worker: { type: String, default: "good", required: false },
    manager: { type: String, default: "warning", required: false },
  },
  fluid_type: {
    worker: { type: String, default: "air", required: false },
    manager: { type: String, default: "oil", required: false },
  },
  test_cycle_count: {
    worker: { type: Number, default: 1000, required: false },
    manager: { type: Number, default: 1500, required: false },
  },
});

const LeakTestThreshold = mongoose.model("LeakTestThreshold", leakTestSchema);

module.exports = LeakTestThreshold;
