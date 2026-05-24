#!/usr/bin/env node

/**
 * Predictive Maintenance System - Setup & Testing Helper
 * Run this script to verify your installation and make test predictions
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}`, "green");
  } else {
    log(`❌ ${description} - NOT FOUND: ${filePath}`, "red");
  }
  return exists;
}

function checkPythonDependencies() {
  log("\n📦 Checking Python Dependencies...", "cyan");

  const requirementsPath = path.join(
    __dirname,
    "ml_models",
    "requirements.txt"
  );
  if (fs.existsSync(requirementsPath)) {
    const requirements = fs.readFileSync(requirementsPath, "utf-8");
    const packages = requirements.split("\n").filter((p) => p.trim());
    log(`Found ${packages.length} Python dependencies:`, "blue");
    packages.forEach((pkg) => log(`  • ${pkg}`, "yellow"));
  }
}

function checkSystemFiles() {
  log("\n📁 Checking System Files...", "cyan");

  const requiredFiles = [
    {
      path: "ml_models/train_predictive_model.py",
      desc: "ML Training Script",
    },
    {
      path: "ml_models/inference.py",
      desc: "Inference Engine",
    },
    {
      path: "services/predictiveMaintenanceService.js",
      desc: "ML Service",
    },
    {
      path: "controllers/predictiveMaintenanceController.js",
      desc: "API Controller",
    },
    {
      path: "models/PredictiveMaintenance.js",
      desc: "Data Models",
    },
    {
      path: "routes/predictiveMaintenanceRoutes.js",
      desc: "API Routes",
    },
    {
      path: "config/mlConfig.js",
      desc: "ML Configuration",
    },
    {
      path: "PREDICTIVE_MAINTENANCE_README.md",
      desc: "Full Documentation",
    },
    {
      path: "QUICK_START.md",
      desc: "Quick Start Guide",
    },
  ];

  let foundCount = 0;
  requiredFiles.forEach((file) => {
    if (checkFileExists(path.join(__dirname, file.path), file.desc)) {
      foundCount++;
    }
  });

  log(`\n${foundCount}/${requiredFiles.length} files found`, "blue");
  return foundCount === requiredFiles.length;
}

function checkDataFiles() {
  log("\n📊 Checking Data Files...", "cyan");

  const dataFiles = [
    {
      path: "data/train_set_rec.csv",
      desc: "Training Data",
    },
    {
      path: "data/test_set_rec.csv",
      desc: "Test Data",
    },
  ];

  let foundCount = 0;
  dataFiles.forEach((file) => {
    if (checkFileExists(path.join(__dirname, file.path), file.desc)) {
      foundCount++;
      // Show file size
      const stats = fs.statSync(path.join(__dirname, file.path));
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`  Size: ${sizeInMB} MB`, "yellow");
    }
  });

  return foundCount === dataFiles.length;
}

function checkNodeDependencies() {
  log("\n🔧 Checking Node Dependencies...", "cyan");

  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const requiredDeps = [
    "express",
    "mongoose",
    "firebase-admin",
    "jsonwebtoken",
    "cors",
    "helmet",
  ];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  let foundCount = 0;
  requiredDeps.forEach((dep) => {
    if (allDeps[dep]) {
      log(`✅ ${dep}@${allDeps[dep]}`, "green");
      foundCount++;
    } else {
      log(`❌ ${dep} - NOT FOUND in package.json`, "red");
    }
  });

  return foundCount === requiredDeps.length;
}

function printNextSteps() {
  log("\n" + "=".repeat(60), "cyan");
  log("🚀 NEXT STEPS", "cyan");
  log("=".repeat(60), "cyan");

  log("\n1. Install Python dependencies:", "yellow");
  log("   pip install -r ml_models/requirements.txt", "blue");

  log("\n2. Train the ML model:", "yellow");
  log("   python ml_models/train_predictive_model.py", "blue");

  log("\n3. Start the server:", "yellow");
  log("   npm run dev", "blue");

  log("\n4. Test the API (in another terminal):", "yellow");
  log(
    "   curl -X POST http://localhost:4000/api/maintenance/predict/agv_003 \\",
    "blue"
  );
  log('     -H "Content-Type: application/json" \\', "blue");
  log(
    '     -d \'{​"temperature": 85, "vibration": 4.2, "efficiency": 72}\'',
    "blue"
  );

  log("\n5. View dashboard summary:", "yellow");
  log(
    "   curl http://localhost:4000/api/maintenance/dashboard/summary",
    "blue"
  );

  log("\n📚 Documentation:", "cyan");
  log("   • Full guide: PREDICTIVE_MAINTENANCE_README.md", "yellow");
  log("   • Quick start: QUICK_START.md", "yellow");
}

function printSummary(allChecks) {
  log("\n" + "=".repeat(60), "cyan");
  log("✨ INSTALLATION CHECK SUMMARY", "cyan");
  log("=".repeat(60), "cyan");

  if (allChecks) {
    log("\n🎉 All checks passed! Your system is ready.", "green");
    log("\nProceed with the Next Steps above.", "green");
  } else {
    log("\n⚠️  Some files are missing. Please review above.", "yellow");
    log("\nMake sure you have all files created properly.", "yellow");
  }
}

// Run all checks
function runAllChecks() {
  log("\n" + "=".repeat(60), "cyan");
  log("🔍 PREDICTIVE MAINTENANCE SYSTEM - SETUP CHECK", "cyan");
  log("=".repeat(60), "cyan");

  const dataFilesOk = checkDataFiles();
  const systemFilesOk = checkSystemFiles();
  const nodeOk = checkNodeDependencies();
  checkPythonDependencies();

  const allChecks = dataFilesOk && systemFilesOk && nodeOk;

  printSummary(allChecks);
  printNextSteps();

  log("\n" + "=".repeat(60) + "\n", "cyan");
}

// Run
runAllChecks();
