const { GoogleGenerativeAI } = require("@google/generative-ai");
const MachineLog = require("../models/machineLogModel");
const RealTimeData = require("../models/EnergyConsumption");
const ErrorLog = require("../models/machineLogModel");

const genAI = new GoogleGenerativeAI("AIzaSyCjOOqsIN_KuT26wdTrG0fz0tpPyXy2ULw");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let chatSession = null;

async function fetchHistoricalData() {
  const historicalLogs = await MachineLog.find()
    .sort({ timestamp: -1 })
    .limit(20);
  return historicalLogs;
}

async function fetchRealTimeData() {
  const realTimeLogs = await RealTimeData.find()
    .sort({ timestamp: -1 })
    .limit(20);
  return realTimeLogs;
}

async function fetchErrorLogs() {
  const errorLogs = await ErrorLog.find().sort({ timestamp: -1 }).limit(20);
  return errorLogs;
}

exports.startChat = async (req, res) => {
  
  try {
    const historicalData = await fetchHistoricalData();
    const realTimeData = await fetchRealTimeData();
    const errorLogs = await fetchErrorLogs();

    const initialPrompt = `
      You are a chatbot that monitors machine data, including historical logs, real-time logs, and error logs. 
      I will provide you with data from 6 different machines. 

      - your answers must be summarized and detailed
      
      ### Historical Data:
      ${JSON.stringify(historicalData, null, 2)}
      
      ### energy Data:
      ${JSON.stringify(realTimeData, null, 2)}
      
      ### Error Logs:
      ${JSON.stringify(errorLogs, null, 2)}

      Based on this data, please provide insights, warnings, and any optimizations that should be made for these machines. 
    `;

    chatSession = await model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: initialPrompt }],
        },
      ],
    });

    res.status(200).json({
      status: {
        success: "Chat session started successfully",
      },
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({ error: "Error starting chat" });
  }
};

exports.sendMessageToChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!chatSession) {
      return res
        .status(400)
        .json({ error: "No active chat session. Start a chat first." });
    }

    const result = await chatSession.sendMessage(message);
    const chatResponse = result.response.text();

    res.status(200).json({ response: chatResponse });
  } catch (error) {
    console.error("Error sending message to chat:", error);
    res.status(500).json({ error: "Error sending message to chat" });
  }
};

exports.resetChat = async (req, res) => {
  try {
    chatSession = null;
    res.status(200).json({ message: "Chat session reset successfully." });
  } catch (error) {
    console.error("Error resetting chat:", error);
    res.status(500).json({ error: "Error resetting chat" });
  }
};







