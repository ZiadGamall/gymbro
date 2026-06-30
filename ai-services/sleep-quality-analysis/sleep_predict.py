"""
Sleep & Recovery Recommendation - Prediction Module
====================================================
Import this from Streamlit or the Zepp fetcher script.
No training code here — just load and predict.

Usage:
    from predict import SleepRecoveryPredictor, from_zepp_api

    predictor = SleepRecoveryPredictor()

    # Option A: pass values directly (manual / Streamlit sliders)
    result = predictor.predict({
        "Gender":                  "Male",
        "Age":                     25,
        "Sleep Duration":          6.5,
        "Quality of Sleep":        7,
        "Physical Activity Level": 45,
        "Stress Level":            6,
        "Heart Rate":              68,
        "Daily Steps":             8000,
    })

    # Option B: convert raw Zepp API response automatically
    model_input = from_zepp_api(zepp_sleep_dict, profile_dict)
    result = predictor.predict(model_input)

    print(result["recommendation"])   # "Train Hard" / "Train Light" / "Rest"
    print(result["message"])
    print(result["confidence"])
"""

import os
import joblib
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# Visual metadata for the Streamlit UI
RECOMMENDATION_META = {
    "Train Hard": {
        "emoji":   "💪",
        "color":   "#18b900",
        "message": "Train Hard",
    },
    "Train Light": {
        "emoji":   "🚶",
        "color":   "#ff9500",
        "message": "Train Light",
    },
    "Rest": {
        "emoji":   "😴",
        "color":   "#e00000",
        "message": "Rest",
    },
}


class SleepRecoveryPredictor:
    """
    Loads the trained model once and exposes a single predict() method.
    Safe to use with Streamlit's @st.cache_resource.
    """

    def __init__(self):
        self._model          = None
        self._feat_encoders  = None
        self._target_encoder = None
        self._feature_cols   = None

    # ── private ──────────────────────────────────────────────
    def _load(self):
        """Lazy-load artefacts on first call."""
        if self._model is not None:
            return

        required = [
            "sleep_rf_model.pkl",
            "sleep_feature_encoders.pkl",
            "sleep_target_encoder.pkl",
            "sleep_feature_cols.pkl",
        ]
        missing = [f for f in required
                   if not os.path.exists(os.path.join(MODEL_DIR, f))]
        if missing:
            raise FileNotFoundError(
                f"Model files not found: {missing}\n"
                "Run  python train_model.py  first to generate them."
            )

        self._model          = joblib.load(os.path.join(MODEL_DIR, "sleep_rf_model.pkl"))
        self._feat_encoders  = joblib.load(os.path.join(MODEL_DIR, "sleep_feature_encoders.pkl"))
        self._target_encoder = joblib.load(os.path.join(MODEL_DIR, "sleep_target_encoder.pkl"))
        self._feature_cols   = joblib.load(os.path.join(MODEL_DIR, "sleep_feature_cols.pkl"))

    # ── public ───────────────────────────────────────────────
    def predict(self, user_input: dict) -> dict:
        """
        Parameters
        ----------
        user_input : dict with these keys:
            Gender                  "Male" or "Female"
            Age                     int, e.g. 25
            Sleep Duration          float hours, e.g. 6.5
            Quality of Sleep        int 1-10
            Physical Activity Level int minutes/day
            Stress Level            int 1-10
            Heart Rate              int bpm
            Daily Steps             int

        Returns
        -------
        dict with keys:
            recommendation  "Train Hard" | "Train Light" | "Rest"
            emoji           str
            color           hex string for UI
            message         str
            confidence      float 0-1
            class_probs     dict  e.g. {"Rest": 0.1, "Train Light": 0.6, ...}
        """
        self._load()

        row = pd.DataFrame([user_input])

        # Encode Gender (the only text feature)
        for col, le in self._feat_encoders.items():
            if col in row.columns:
                val = str(row.at[0, col])
                if val not in le.classes_:
                    # Unknown value → default to first known class
                    print(f"  [WARN] Unknown value '{val}' for '{col}', "
                          f"defaulting to '{le.classes_[0]}'")
                    val = le.classes_[0]
                row[col] = le.transform([val])

        # Ensure column order matches training exactly
        X = row[self._feature_cols].values

        pred_enc   = self._model.predict(X)[0]
        proba      = self._model.predict_proba(X)[0]
        label      = self._target_encoder.inverse_transform([pred_enc])[0]
        class_prob = {
            cls: round(float(p), 3)
            for cls, p in zip(self._target_encoder.classes_, proba)
        }

        meta = RECOMMENDATION_META[label]
        return {
            "recommendation": label,
            "emoji":          meta["emoji"],
            "color":          meta["color"],
            "message":        meta["message"],
            "confidence":     round(float(max(proba)), 3),
            "class_probs":    class_prob,
        }

    @property
    def valid_labels(self) -> dict:
        """Returns known categorical values, e.g. {"Gender": ["Female","Male"]}"""
        self._load()
        return {col: list(le.classes_)
                for col, le in self._feat_encoders.items()}

    @property
    def feature_cols(self) -> list:
        self._load()
        return list(self._feature_cols)


# ── Zepp API converter ────────────────────────────────────────
def from_zepp_api(zepp_sleep: dict, profile: dict) -> dict:
    """
    Converts raw Zepp API fields into the model's expected input dict.

    zepp_sleep keys (all provided by Bip 6 automatically):
        total_sleep_min     int   total minutes asleep
        deep_sleep_min      int   minutes in deep sleep
        rem_sleep_min       int   minutes in REM sleep
        hr_avg_bpm          int   average heart rate during sleep
        sleep_score         int   Zepp's own sleep score 0-100
        avg_stress_score    int   average stress yesterday 0-100
        steps               int   daily step count yesterday
        active_minutes      int   active/workout minutes yesterday

    profile keys (entered once by user):
        Gender   "Male" | "Female"
        Age      int

    How Deep Sleep and REM are used:
        They are NOT separate model features (the training dataset
        had no such columns). Instead they refine the Quality of Sleep
        score that IS a model feature. Low deep sleep → quality penalty.
        This way real Zepp data improves prediction without adding
        features that were absent during training.
    """
    total_min = zepp_sleep.get("total_sleep_min", 420)
    deep_min  = zepp_sleep.get("deep_sleep_min",  80)
    rem_min   = zepp_sleep.get("rem_sleep_min",   90)

    # Base quality from Zepp's own sleep score (0-100 → 1-10)
    sleep_score  = zepp_sleep.get("sleep_score", 70)
    quality_base = sleep_score / 10.0

    # Penalty if deep sleep is very low (< 13% of total)
    # Deep sleep is critical for physical recovery
    if total_min > 0:
        deep_pct = deep_min / total_min * 100
        if deep_pct < 10:
            quality_base -= 2.0   # strong penalty
        elif deep_pct < 13:
            quality_base -= 1.0   # mild penalty

    # Penalty if REM is very low (< 15% of total)
    # REM is critical for cognitive recovery
    if total_min > 0:
        rem_pct = rem_min / total_min * 100
        if rem_pct < 12:
            quality_base -= 1.0

    quality_final = int(max(1, min(10, round(quality_base))))

    # Zepp stress 0-100 → 1-10
    stress_score = zepp_sleep.get("avg_stress_score", 50)
    stress_1_10  = max(1, min(10, round(stress_score / 10)))

    sleep_duration_hours = round(total_min / 60, 2)

    return {
        "Gender":                  profile.get("Gender", "Male"),
        "Age":                     profile.get("Age", 25),
        "Sleep Duration":          sleep_duration_hours,
        "Quality of Sleep":        quality_final,
        "Physical Activity Level": zepp_sleep.get("active_minutes", 30),
        "Stress Level":            stress_1_10,
        "Heart Rate":              zepp_sleep.get("hr_avg_bpm", 65),
        "Daily Steps":             zepp_sleep.get("steps", 7000),
    }
