import os
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

# Import your teammate's existing machine learning logic
from calorie_predictor import predict_calories

app = FastAPI(
    title="Calorie Prediction Service",
    description="Asynchronous microservice for predicting calories burned using a trained Random Forest model.",
    version="1.0.0"
)

# ── Define Request Data Schema via Pydantic ─────────────────────────
class PredictionRequest(BaseModel):
    gender: str = Field(..., description="Must be 'male' or 'female'")
    age: float = Field(..., gte=1, lte=120, description="Age in years")
    height: float = Field(..., gte=50, lte=250, description="Height in centimeters")
    weight: float = Field(..., gte=10, lte=300, description="Weight in kilograms")
    duration: float = Field(..., gte=1, lte=300, description="Workout length in minutes")
    heart_rate: float = Field(..., gte=30, lte=220, description="Average heart rate in bpm")

    class Config:
        populate_by_name = True


# ── Health Check Endpoint ───────────────────────────────────────────
@app.get("/health", status_code=status.HTTP_200_OK)
async def health():
    return {"status": "ok"}


# ── Prediction Endpoint ─────────────────────────────────────────────
@app.post("/predict", status_code=status.HTTP_200_OK)
async def predict(body: PredictionRequest):
    gender_parsed = body.gender.strip().lower()
    if gender_parsed not in ("male", "female"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": ["body", "gender"], "msg": "gender must be 'male' or 'female'", "type": "value_error"}]
        )

    try:
        calories = predict_calories(
            gender=gender_parsed,
            age=body.age,
            height=body.height,
            weight=body.weight,
            duration=body.duration,
            heart_rate=body.heart_rate,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction engine failed: {str(exc)}"
        )

    return {
        "calories_burned": calories,
        "unit": "kcal",
        "inputs": {
            "gender": gender_parsed,
            "age": body.age,
            "height": body.height,
            "weight": body.weight,
            "duration": body.duration,
            "heart_rate": body.heart_rate,
        },
    }