import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
import joblib
import json
from datetime import datetime
import warnings

warnings.filterwarnings("ignore")

class PredictiveMaintenanceModel:
    def __init__(self, model_type="random_forest"):
        self.model_type = model_type
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metrics = {}

    def load_data(self, train_path, test_path):
        """Load and preprocess training and test data"""
        print(f"Loading training data from {train_path}...")
        train_df = pd.read_csv(train_path)
        print(f"Loading test data from {test_path}...")
        test_df = pd.read_csv(test_path)

        print(f"Train data shape: {train_df.shape}")
        print(f"Test data shape: {test_df.shape}")
        print(f"\nTrain data columns: {train_df.columns.tolist()}")
        print(f"\nTrain data info:\n{train_df.info()}")
        print(f"\nFirst few rows:\n{train_df.head()}")

        return train_df, test_df

    def create_features(self, df):
        """Engineer features from raw KPI data for better predictions"""
        df = df.copy()
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])
        df = df.sort_values("Timestamp")

        # Create rolling statistics for anomaly detection
        for kpi in df["KPI_Name"].unique():
            kpi_data = df[df["KPI_Name"] == kpi].copy()

            # Rolling mean and std
            df.loc[df["KPI_Name"] == kpi, "rolling_mean_5"] = (
                kpi_data["KPI_Value"]
                .rolling(window=5, min_periods=1)
                .mean()
                .values
            )
            df.loc[df["KPI_Name"] == kpi, "rolling_std_5"] = (
                kpi_data["KPI_Value"]
                .rolling(window=5, min_periods=1)
                .std()
                .fillna(0)
                .values
            )
            df.loc[df["KPI_Name"] == kpi, "rolling_mean_20"] = (
                kpi_data["KPI_Value"]
                .rolling(window=20, min_periods=1)
                .mean()
                .values
            )

            # Exponential moving average
            df.loc[df["KPI_Name"] == kpi, "ema_5"] = (
                kpi_data["KPI_Value"].ewm(span=5, adjust=False).mean().values
            )

            # Rate of change
            df.loc[df["KPI_Name"] == kpi, "roc"] = (
                kpi_data["KPI_Value"].pct_change().fillna(0).values
            )

            # Anomaly score: deviation from rolling mean
            df.loc[df["KPI_Name"] == kpi, "anomaly_score"] = np.abs(
                (
                    kpi_data["KPI_Value"].values
                    - kpi_data["KPI_Value"].rolling(window=20, min_periods=1).mean().values
                )
                / (
                    kpi_data["KPI_Value"].rolling(window=20, min_periods=1).std().values
                    + 1e-5
                )
            )

        # Temporal features
        df["hour"] = df["Timestamp"].dt.hour
        df["day"] = df["Timestamp"].dt.day
        df["month"] = df["Timestamp"].dt.month
        df["day_of_week"] = df["Timestamp"].dt.dayofweek

        # KPI encoding
        kpi_mapping = {kpi: i for i, kpi in enumerate(df["KPI_Name"].unique())}
        df["kpi_encoded"] = df["KPI_Name"].map(kpi_mapping)

        # Fill NaN values
        df = df.fillna(method="bfill").fillna(method="ffill").fillna(0)

        return df

    def prepare_training_data(self, df):
        """Prepare features and target for model training"""
        # Define features to use
        feature_columns = [
            "KPI_Value",
            "rolling_mean_5",
            "rolling_std_5",
            "rolling_mean_20",
            "ema_5",
            "roc",
            "anomaly_score",
            "hour",
            "day",
            "month",
            "day_of_week",
            "kpi_encoded",
        ]

        X = df[feature_columns].copy()
        
        # Create binary target if Status column exists
        # For test data without Status column, return None for y
        if "Status" in df.columns:
            y = (df["Status"] > 0).astype(int).values
        else:
            y = None

        self.feature_names = feature_columns

        # Handle any remaining NaN or infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean())

        return X, y

    def train(self, X_train, y_train):
        """Train the predictive maintenance model"""
        # Standardize features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)

        if self.model_type == "random_forest":
            print("Training Random Forest model...")
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=10,
                min_samples_leaf=5,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            )
        elif self.model_type == "gradient_boosting":
            print("Training Gradient Boosting model...")
            self.model = GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=7,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42,
            )

        self.model.fit(X_train_scaled, y_train)

        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X_train_scaled, y_train, cv=5, scoring="f1"
        )
        print(f"Cross-validation F1 scores: {cv_scores}")
        print(f"Mean CV F1 Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        # If no test labels, skip evaluation and return cross-validation results
        if y_test is None:
            print("\n=== Skipping Test Evaluation (No labels available) ===")
            print("Model evaluation was performed using cross-validation during training.")
            return None
        
        X_test_scaled = self.scaler.transform(X_test)
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        self.metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1_score": f1_score(y_test, y_pred, zero_division=0),
            "auc_score": roc_auc_score(y_test, y_pred_proba),
        }

        print("\n=== Model Performance ===")
        print(f"Accuracy:  {self.metrics['accuracy']:.4f}")
        print(f"Precision: {self.metrics['precision']:.4f}")
        print(f"Recall:    {self.metrics['recall']:.4f}")
        print(f"F1 Score:  {self.metrics['f1_score']:.4f}")
        print(f"AUC Score: {self.metrics['auc_score']:.4f}")
        print("\n=== Classification Report ===")
        print(classification_report(y_test, y_pred, target_names=["Normal", "Failure"]))
        print("\n=== Confusion Matrix ===")
        print(confusion_matrix(y_test, y_pred))

        return self.metrics

    def save_model(self, filepath):
        """Save trained model to disk"""
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "model_type": self.model_type,
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load pre-trained model from disk"""
        model_data = joblib.load(filepath)
        self.model = model_data["model"]
        self.scaler = model_data["scaler"]
        self.feature_names = model_data["feature_names"]
        self.model_type = model_data["model_type"]
        print(f"Model loaded from {filepath}")

    def predict(self, X):
        """Make predictions on new data"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")

        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]

        return predictions, probabilities

    def get_feature_importance(self, top_n=10):
        """Get top N most important features"""
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:top_n]

        print("\n=== Top 10 Important Features ===")
        for i, idx in enumerate(indices, 1):
            print(f"{i}. {self.feature_names[idx]}: {importances[idx]:.4f}")

        return dict(zip([self.feature_names[i] for i in indices], importances[indices]))


def main():
    # Initialize model
    model = PredictiveMaintenanceModel(model_type="random_forest")

    # Load data
    train_path = "data/train_set_rec.csv"
    test_path = "data/test_set_rec.csv"

    train_df, test_df = model.load_data(train_path, test_path)

    # Feature engineering
    print("\n=== Creating Features ===")
    train_df = model.create_features(train_df)
    test_df = model.create_features(test_df)

    # Prepare data
    print("\n=== Preparing Training Data ===")
    X_train, y_train = model.prepare_training_data(train_df)
    print(f"Training set size: {X_train.shape}")
    print(f"Failure rate: {y_train.mean():.2%}")

    print("\n=== Preparing Test Data ===")
    X_test, y_test = model.prepare_training_data(test_df)
    print(f"Test set size: {X_test.shape}")
    
    # Check if test data has labels
    if y_test is None:
        print("Note: Test data does not contain Status labels.")
        print("Will use cross-validation on training data for evaluation.")
    else:
        print(f"Failure rate: {y_test.mean():.2%}")

    # Train model
    print("\n=== Training Model ===")
    model.train(X_train, y_train)

    # Evaluate model
    print("\n=== Evaluating Model ===")
    model.evaluate(X_test, y_test)

    # Feature importance
    model.get_feature_importance()

    # Save model
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = f"ml_models/predictive_maintenance_model_{timestamp}.pkl"
    model.save_model(model_path)

    # Save metrics
    metrics_path = f"ml_models/model_metrics_{timestamp}.json"
    with open(metrics_path, "w") as f:
        json.dump(model.metrics, f, indent=2)
    print(f"\nMetrics saved to {metrics_path}")


if __name__ == "__main__":
    main()
