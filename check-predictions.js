// Quick test to check MongoDB connection and saved predictions
const mongoose = require("mongoose");
const {
  MaintenancePrediction,
  ModelMetrics,
} = require("./models/PredictiveMaintenance");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://younes:younes@cluster0.8fm7l.mongodb.net/sensorDb?retryWrites=true&w=majority",
      {}
    );
    console.log("✅ MongoDB connected successfully");

    // Check model metrics
    const models = await ModelMetrics.find();
    console.log(`\n🤖 Found ${models.length} models in database:`);
    models.forEach((m, i) => {
      console.log(`\n${i + 1}. Version: ${m.model_version}`);
      console.log(`   Active: ${m.is_active}`);
      console.log(`   Training Date: ${m.training_date}`);
      console.log(`   Path: ${m.model_path}`);
    });

    // Check predictions
    const predictions = await MaintenancePrediction.find().limit(5);
    console.log(`\n\n📊 Found ${predictions.length} predictions in database:`);
    predictions.forEach((p, i) => {
      console.log(`\n${i + 1}. Machine: ${p.machine_id}`);
      console.log(`   Probability: ${p.failure_probability}`);
      console.log(`   Urgency: ${p.maintenance_urgency}`);
      console.log(`   Date: ${p.prediction_date}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

connectDB();
