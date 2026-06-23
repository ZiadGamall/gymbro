"""
ml_service.py
-------------
Lightweight Flask microservice that exposes the calorie prediction model
over HTTP so any backend (Node/Express, etc.) can call it.

Start with:
    python ml_service.py

It listens on http://localhost:5001 by default.
Set ML_SERVICE_PORT env var to override.
"""

import os
from flask import Flask, request, jsonify
from calorie_predictor import predict_calories   # your existing module

app = Flask(__name__)

# ── Health check ──────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ── Prediction endpoint ───────────────────────────────────────────────────────

REQUIRED_FIELDS = {
    "gender":     str,
    "age":        (int, float),
    "height":     (int, float),
    "weight":     (int, float),
    "duration":   (int, float),
    "heart_rate": (int, float),
}

@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True)

    # ── 1. Body must be JSON ──────────────────────────────────────────────────
    if body is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    # ── 2. Validate required fields & types ───────────────────────────────────
    errors = []
    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in body:
            errors.append(f"'{field}' is required")
        elif not isinstance(body[field], expected_type):
            type_name = expected_type.__name__ if isinstance(expected_type, type) else "/".join(t.__name__ for t in expected_type)
            errors.append(f"'{field}' must be {type_name}")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    # ── 3. Domain-level validation ────────────────────────────────────────────
    gender = str(body["gender"]).strip().lower()
    if gender not in ("male", "female"):
        return jsonify({"error": "'gender' must be 'male' or 'female'"}), 422

    age        = body["age"]
    height     = body["height"]
    weight     = body["weight"]
    duration   = body["duration"]
    heart_rate = body["heart_rate"]

    range_checks = [
        (age,        1,   120, "age"),
        (height,    50,   250, "height (cm)"),
        (weight,    10,   300, "weight (kg)"),
        (duration,   1,   300, "duration (minutes)"),
        (heart_rate, 30,  220, "heart_rate (bpm)"),
    ]
    for value, lo, hi, label in range_checks:
        if not (lo <= value <= hi):
            errors.append(f"'{label}' must be between {lo} and {hi}")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    # ── 4. Run prediction ─────────────────────────────────────────────────────
    try:
        calories = predict_calories(
            gender=gender,
            age=age,
            height=height,
            weight=weight,
            duration=duration,
            heart_rate=heart_rate,
        )
    except Exception as exc:
        app.logger.error("Prediction error: %s", exc)
        return jsonify({"error": "Prediction failed", "detail": str(exc)}), 500

    return jsonify({
        "calories_burned": calories,
        "unit": "kcal",
        "inputs": {
            "gender": gender, "age": age, "height": height,
            "weight": weight, "duration": duration, "heart_rate": heart_rate,
        },
    }), 200


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)