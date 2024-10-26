const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const router = express.Router();

const filterKPIDataForDate = (filePath, kpiName, date) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        if (data.KPI_Name === kpiName) {
          const timestamp = new Date(data.Timestamp);
          const dateStr = timestamp.toISOString().split("T")[0];

          // Only include rows that match the specified date
          if (dateStr === date) {
            results.push(data);
          }
        }
      })
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

// Real-Time Streaming Endpoint for Stamping Press Efficiency KPI
router.get("/stamping-press-efficiency-stream", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Stamping Press Efficiency",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

// Endpoint for Welding Robot Efficiency KPI
router.get("/welding-robot-efficiency", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Welding Robot Efficiency",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/cnc-machine-utilization", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "CNC Machine Utilization",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/painting-robot-performance", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Painting Robot Performance",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/assembly-line-speed", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Assembly Line Speed",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/quality-control-defect-rate", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Quality Control Defect Rate",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/material-waste-percentage", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Material Waste Percentage",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/machine-downtime", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Machine Downtime",
      "2016-08-24" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/operator-efficiency", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Operator Efficiency",
      "2016-08-12" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/inventory-turnover-rate", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Inventory Turnover Rate",
      "2016-08-20" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/maintenance-cost-per-unit", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Maintenance Cost per Unit",
      "2016-11-23" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});

router.get("/energy-consumption-per-unit", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Energy Consumption per Unit",
      "2017-07-31" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});
router.get("/production-yield-rate", async (req, res) => {
  try {
    const data = await filterKPIDataForDate(
      "data/test_set_rec.csv",
      "Production Yield Rate",
      "2016-08-20" // Specific date you want to stream
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let index = 0;

    const interval = setInterval(() => {
      if (index < data.length) {
        // Send every 10th data point (10-minute interval)
        if (index % 10 === 0) {
          res.write(`data: ${JSON.stringify(data[index])}\n\n`);
        }
        index += 1;
      } else {
        clearInterval(interval);
        res.write("event: end\n");
        res.write("data: Stream Ended\n\n");
        res.end();
      }
    }, 500); // 1-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
});
module.exports = router;
