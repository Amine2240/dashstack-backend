import os
import json
import numpy as np
import joblib
from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

# Load model once at startup (not on every request)
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "predictive_maintenance_model_20251206_000601.pkl")
)

model_data = None

def load_model():
    global model_data
    try:
        model_data = joblib.load(MODEL_PATH)
        print(f"[ML] Model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"[ML] Warning: Could not load model: {e}")
        model_data = None

# ── copied exactly from your inference.py ──────────────────────────────────

def identify_affected_parameters(features, thresholds=None):
    if thresholds is None:
        thresholds = {
            "temperature": 80,
            "vibration": 5,
            "pressure": 10,
            "efficiency": 70,
            "error_count": 10,
            "power_consumption": 5000,
        }
    affected = []
    if features.get("temperature", 0) > thresholds["temperature"]:
        affected.append({
            "parameter_name": "temperature",
            "current_value": features.get("temperature"),
            "anomaly_score": min((features.get("temperature") / thresholds["temperature"]) - 1, 1.0)
        })
    if features.get("vibration", 0) > thresholds["vibration"]:
        affected.append({
            "parameter_name": "vibration",
            "current_value": features.get("vibration"),
            "anomaly_score": min((features.get("vibration") / thresholds["vibration"]) - 1, 1.0)
        })
    if features.get("efficiency", 100) < thresholds["efficiency"]:
        affected.append({
            "parameter_name": "efficiency",
            "current_value": features.get("efficiency"),
            "anomaly_score": max(1 - (features.get("efficiency") / thresholds["efficiency"]), 0)
        })
    if features.get("error_count", 0) > thresholds["error_count"]:
        affected.append({
            "parameter_name": "error_count",
            "current_value": features.get("error_count"),
            "anomaly_score": min((features.get("error_count") / thresholds["error_count"]) - 1, 1.0)
        })
    return affected

def make_prediction(input_data):
    features = input_data.get("features", {})
    feature_vector = np.array([
        features.get("kpi_value", 0),
        features.get("temperature", 0),
        features.get("vibration", 0),
        features.get("pressure", 0),
        features.get("runtime_hours", 0),
        features.get("error_count", 0),
        features.get("efficiency", 100),
        features.get("power_consumption", 0),
        datetime.now().hour,
        datetime.now().day,
        datetime.now().month,
        datetime.now().weekday(),
        0,
    ]).reshape(1, -1)

    model   = model_data["model"]
    scaler  = model_data["scaler"]
    feature_vector_scaled = scaler.transform(feature_vector)
    prediction  = model.predict(feature_vector_scaled)[0]
    probability = model.predict_proba(feature_vector_scaled)[0][1]
    affected    = identify_affected_parameters(features)
    confidence  = min(len(affected) * 0.2 + probability, 1.0)

    return {
        "prediction": int(prediction),
        "failure_probability": float(probability),
        "confidence_score": float(confidence),
        "affected_parameters": affected,
        "timestamp": datetime.now().isoformat()
    }

# ── routes ──────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model_data is not None})

@app.route("/predict", methods=["POST"])
def predict():
    if model_data is None:
        return jsonify({"error": "Model not loaded"}), 503

    body = request.get_json(force=True)
    if not body:
        return jsonify({"error": "Empty request body"}), 400

    try:
        result = make_prediction(body)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "failure_probability": 0.5,
            "confidence_score": 0.0,
            "affected_parameters": []
        }), 500

# ── startup ──────────────────────────────────────────────────────────────────

load_model()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)