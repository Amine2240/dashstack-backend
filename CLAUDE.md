# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with nodemon (port 4000)
npm install          # Install Node.js dependencies

# Python ML service (run separately in ml_models/)
pip install -r ml_models/requirements.txt
python ml_models/app.py          # Start Flask inference server
python ml_models/train_predictive_model.py  # Retrain the model

# Expose local server for IoT webhooks
lt --port 4000 --subdomain cool-api-project --local-host "localhost" -o --print-requests
```

No test suite is configured (`npm test` exits with error).

## Environment Setup

Create a `.env` file in the root with:

```
PORT=4000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
JWT_SECRET=...
JWT_ACCESS_EXPIRES_IN=3d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
```

A `firebase-config.json` is required in the root for push notifications via `services/firebaseService.js`.

## Architecture

This is a manufacturing IoT backend for a factory dashboard ("DashStack"). The main branch is `master`.

### Dual-service design

The system has two independent processes:

1. **Node.js/Express API** (`server.js`, port 4000) — handles all REST API requests, sensor data ingestion, auth, notifications, and orchestrates ML calls.
2. **Python Flask ML service** (`ml_models/app.py`) — serves predictions from a trained scikit-learn model (`.pkl`). The Node service calls it via a child process spawn, not HTTP — see `services/predictiveMaintenanceService.js`.

### Request flow for sensor data

```
IoT Machine → POST /webhook-v1/<machine-type>
           → machine-specific controller (e.g., agvController.js)
           → machineController.js (threshold checks, notifications)
           → Firebase push notification if threshold breached
           → POST /api/maintenance/predict/:machine_id (optional)
             → predictiveMaintenanceService.js
             → Python inference.py (subprocess)
             → MongoDB PredictiveMaintenance collection
```

### Machine types

Six machine types are modeled, each with its own controller, model, threshold config, and webhook route: **AGV** (`agv_003`), **CNC Milling** (`cnc_milling_004`), **Welding Robot** (`welding_robot_006`), **Stamping Press** (`stamping_press_001`), **Painting Robot** (`painting_robot_002`), **Leak Test** (`leak_test_005`).

### Two-tier alerting

`config/machineThresholds.js` defines `{ worker, manager }` threshold pairs for every sensor per machine. Breaching the worker threshold notifies the assigned worker; breaching the manager threshold escalates to the manager via `notifyWorker` / `notifyManager` in `machineController.js`.

### Auth & roles

- JWT-based auth via `middleware/authMiddleware.js` + `utils/jwt.js`
- Role-based access via `middleware/role.js` (`authRole(roles)`) — roles include `admin`, `manager`, `supervisor`, `worker`
- Tokens: short-lived access token + refresh token pattern

### Key route prefixes

| Prefix | Purpose |
|---|---|
| `/webhook-v1` | IoT sensor data ingestion |
| `/auth` | Login, register, token refresh |
| `/api/maintenance` | Predictive maintenance predictions & history |
| `/machine-thresholds` | CRUD for per-machine alert thresholds |
| `/tasks`, `/ai` | Task management and AI scheduling |
| `/notifications` | Push notification history |
| `/energy` | Energy consumption tracking |
| `/api/kpi` | KPI aggregation |
| `/chat` | Gemini AI chatbot |
| `/logs` | Machine log history |
| `/historical-data` | Time-series sensor data queries |
| `/order-tracking` | Product/order lifecycle |

### ML model

Trained as Random Forest or Gradient Boosting on `data/train_set_rec.csv`. Saved as `ml_models/predictive_maintenance_model_*.pkl`. Model metadata (accuracy, version, active flag) lives in the `ModelMetrics` MongoDB collection. Config params (urgency thresholds, feature windows, notification recipients by urgency level) are centralized in `config/mlConfig.js`.

### Error handling pattern

Controllers use `catchAsync(fn)` from `utils/errorHandler.js` to wrap async route handlers. Throw `new AppError(message, statusCode)` for known errors; the `globalErrorHandler` middleware in `server.js` handles formatting and Mongoose-specific errors (cast errors, validation, duplicates).
