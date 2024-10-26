if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();

  require("events").EventEmitter.defaultMaxListeners = 10000;
} else {
  console.log("Running in production mode");
}

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");

const logger = require("./middleware/logger.js");
const { globalErrorHandler } = require("./utils/errorHandler");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://younes:younes@cluster0.8fm7l.mongodb.net/sensorDb?retryWrites=true&w=majority",
      {}
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
connectDB();

app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.use(logger);

// import routes
const authRoutes = require("./routes/authRoutes");
const uploadAttachment = require("./routes/uploadRoutes");
const machineThresholdRoutes = require("./routes/machineThresholdRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require("./routes/taskSchedulerRoutes.js");
const energyRoutes = require("./routes/energyRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const logRoutes = require("./routes/logRoutes");
const historicalDataRoutes = require("./routes/historicalDataRoutes");
const productTrackingRoutes = require("./routes/productRoutes.js");
const kpiRoutes = require("./routes/kpi.js")

// routes

app.use("/machine-thresholds", machineThresholdRoutes);
app.use("/webhook-v1", webhookRoutes);
app.use("/upload", uploadAttachment); // out of order
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);
app.use("/ai", aiRoutes);
app.use("/energy", energyRoutes);
app.use("/chat", chatRoutes);
app.use("/historical-data", historicalDataRoutes);
app.use("/logs", logRoutes);
app.use("/order-tracking",productTrackingRoutes);
app.use('/api/kpi', kpiRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
