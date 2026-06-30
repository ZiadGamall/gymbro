"""
calorie_predictor.py
---------------------
Reusable backend module for predicting calories burned.

The model is ALREADY TRAINED — this module only loads the saved model and
makes predictions. No training happens here.

Required files in the same folder (produced earlier by train_model.py):
    - calories_model.pkl   (the trained Random Forest)
    - gender_encoder.pkl   (encodes 'male'/'female')

Usage from other code:
    from calorie_predictor import predict_calories

    kcal = predict_calories(
        gender="male", age=25, height=175,
        weight=70, duration=30, heart_rate=110
    )
    print(kcal)   # e.g. 196.0
"""

import os
import joblib
import pandas as pd

# Resolve paths relative to THIS file, so imports work no matter where
# the calling script is run from.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.join(_BASE_DIR, "calories_model.pkl")
_ENCODER_PATH = os.path.join(_BASE_DIR, "gender_encoder.pkl")

_FEATURE_COLS = ["Gender", "Age", "Height", "Weight", "Duration", "Heart_Rate"]

# Load once at import time and cache, so repeated predictions are fast
# (no reloading the model from disk on every call).
_model = None
_encoder = None


def _load():
    global _model, _encoder
    if _model is None or _encoder is None:
        if not os.path.exists(_MODEL_PATH) or not os.path.exists(_ENCODER_PATH):
            raise FileNotFoundError(
                "Trained model files not found. Expected:\n"
                f"  {_MODEL_PATH}\n  {_ENCODER_PATH}\n"
                "Run train_model.py once to generate them."
            )
        _model = joblib.load(_MODEL_PATH)
        _encoder = joblib.load(_ENCODER_PATH)
    return _model, _encoder


def predict_calories(gender, age, height, weight, duration, heart_rate):
    """
    Predict calories burned for a single workout session.

    Parameters
    ----------
    gender : str    -> "male" or "female"
    age : int       -> years
    height : float  -> centimetres
    weight : float  -> kilograms
    duration : float-> workout length in minutes
    heart_rate : float -> average heart rate in bpm

    Returns
    -------
    float : predicted calories burned, rounded to 1 decimal place.
    """
    model, encoder = _load()

    gender = str(gender).strip().lower()
    if gender not in ("male", "female"):
        raise ValueError("gender must be 'male' or 'female'")

    gender_encoded = encoder.transform([gender])[0]

    row = pd.DataFrame([{
        "Gender": gender_encoded,
        "Age": age,
        "Height": height,
        "Weight": weight,
        "Duration": duration,
        "Heart_Rate": heart_rate,
    }])[_FEATURE_COLS]

    prediction = float(model.predict(row)[0])
    return round(prediction, 1)


# Quick self-test when run directly: python calorie_predictor.py
if __name__ == "__main__":
    demo = predict_calories(
        gender="male", age=25, height=175,
        weight=70, duration=30, heart_rate=110
    )
    print(f"Demo prediction: {demo} kcal")
