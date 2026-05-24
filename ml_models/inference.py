"""
Inference script for predictive maintenance model
Takes input data and model path, returns predictions as JSON
"""

import sys
import json
import numpy as np
import joblib
from datetime import datetime

def load_model(model_path):
    """Load the trained model"""
    try:
        model_data = joblib.load(model_path)
        return model_data
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        raise

def extract_features_for_inference(input_data):
    """Extract and prepare features for inference"""
    features = input_data.get("features", {})
    
    # Map features to the order used during training
    feature_vector = np.array([
        features.get("kpi_value", 0),
        features.get("temperature", 0),
        features.get("vibration", 0),
        features.get("pressure", 0),
        features.get("runtime_hours", 0),
        features.get("error_count", 0),
        features.get("efficiency", 100),
        features.get("power_consumption", 0),
    ]).reshape(1, -1)
    
    return feature_vector

def identify_affected_parameters(features, thresholds=None):
    """Identify which parameters are causing the anomaly"""
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

def make_prediction(input_data, model_data):
    """Make prediction using the loaded model"""
    try:
        model = model_data["model"]
        scaler = model_data["scaler"]
        
        # For this simplified inference, we'll use the features directly
        # In a production system, you'd want to replicate the full feature engineering
        features = input_data.get("features", {})
        
        # Create a simplified feature vector matching the model's expected input
        # This would need to match the feature_columns used during training
        feature_vector = np.array([
            features.get("kpi_value", 0),
            features.get("temperature", 0),
            features.get("vibration", 0),
            features.get("pressure", 0),
            features.get("runtime_hours", 0),
            features.get("error_count", 0),
            features.get("efficiency", 100),
            features.get("power_consumption", 0),
            23,  # hour (current time)
            datetime.now().day,
            datetime.now().month,
            datetime.now().weekday(),
            0,  # kpi_encoded (0-indexed)
        ]).reshape(1, -1)
        
        # Scale features
        feature_vector_scaled = scaler.transform(feature_vector)
        
        # Make prediction
        prediction = model.predict(feature_vector_scaled)[0]
        probability = model.predict_proba(feature_vector_scaled)[0][1]
        
        # Get affected parameters
        affected_params = identify_affected_parameters(features)
        
        # Calculate confidence based on feature anomalies
        confidence = min(len(affected_params) * 0.2 + probability, 1.0)
        
        return {
            "prediction": int(prediction),
            "failure_probability": float(probability),
            "confidence_score": float(confidence),
            "affected_parameters": affected_params,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error making prediction: {e}", file=sys.stderr)
        raise

def main():
    """Main inference function"""
    try:
        if len(sys.argv) < 3:
            print("Usage: python inference.py <input_json> <model_path>", file=sys.stderr)
            sys.exit(1)
        
        # Parse input
        input_json = sys.argv[1]
        model_path = sys.argv[2]
        
        input_data = json.loads(input_json)
        
        # Load model
        model_data = load_model(model_path)
        
        # Make prediction
        result = make_prediction(input_data, model_data)
        
        # Output as JSON to stdout
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "failure_probability": 0.5,
            "confidence_score": 0.0,
            "affected_parameters": []
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
