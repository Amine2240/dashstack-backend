// Test script for Predictive Maintenance API
const baseUrl = "http://localhost:4000/api/maintenance";

// You'll need a valid JWT token - get one by logging in first
const token = "YOUR_JWT_TOKEN_HERE"; // Replace with actual token

async function testAPI() {
  console.log("=== Testing Predictive Maintenance API ===\n");

  // Test 1: Get Dashboard Summary
  console.log("1. Testing Dashboard Summary...");
  try {
    const response = await fetch(`${baseUrl}/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log("✅ Dashboard Summary:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Test 2: Make a Prediction
  console.log("\n2. Testing Prediction for AGV-003...");
  try {
    const machineData = {
      temperature: 85,
      vibration: 4.2,
      efficiency: 72,
      error_count: 5,
      kpi_name: "AGV Efficiency",
    };

    const response = await fetch(`${baseUrl}/predict/agv_003`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(machineData),
    });
    const data = await response.json();
    console.log("✅ Prediction Result:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Test 3: Get Model Metrics
  console.log("\n3. Testing Model Metrics...");
  try {
    const response = await fetch(`${baseUrl}/model-metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log("✅ Model Metrics:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

// Run tests
testAPI().catch(console.error);
