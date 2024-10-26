const fs = require("fs");
const csv = require("csv-parser");

exports.filterKPIDataForDate = (filePath, kpiName, date) => {
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

exports.processStamping =  async (req, res) => {
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
    }, 500); // 0.5-second interval to simulate real-time 10-minute jumps

    req.on("close", () => clearInterval(interval)); // Clean up on client disconnect
  } catch (error) {
    res.status(500).json({ error: "Error reading or parsing the CSV file" });
  }
}