from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sleep_predict import SleepRecoveryPredictor, from_zepp_api

# Initialize the FastAPI application
app = FastAPI(
    title="GymBro Recovery Prediction Service",
    description="Microservice to predict optimal training intensity based on Zepp API sleep data.",
    version="1.0.0"
)

# Instantiate the predictor (it will lazy-load the .pkl artifacts on the first request)
predictor = SleepRecoveryPredictor()

# ── Pydantic Schemas For Strict Request Validation ───────────

class UserProfile(BaseModel):
    Gender: str = Field(..., description="'Male' or 'Female'")
    Age: int = Field(..., ge=10, le=100, description="Age of the user")

class ZeppSleepData(BaseModel):
    total_sleep_min: int = Field(..., ge=0, description="Total minutes asleep")
    deep_sleep_min: int = Field(..., ge=0, description="Minutes spent in deep sleep")
    rem_sleep_min: int = Field(..., ge=0, description="Minutes spent in REM sleep")
    hr_avg_bpm: int = Field(..., ge=30, le=200, description="Average heart rate during sleep")
    sleep_score: int = Field(..., ge=0, le=100, description="Zepp sleep score (0-100)")
    avg_stress_score: int = Field(..., ge=0, le=100, description="Average stress score yesterday (0-100)")
    steps: int = Field(..., ge=0, description="Daily step count yesterday")
    active_minutes: int = Field(..., ge=0, description="Active/workout minutes yesterday")

class RecoveryRequest(BaseModel):
    profile: UserProfile
    zepp_sleep: ZeppSleepData

# ── API Endpoints ─────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "online", "service": "GymBro Recovery API"}

@app.post("/predict-recovery")
def predict_recovery(payload: RecoveryRequest):
    """
    Accepts user profile and Zepp metrics from GymBro's primary backend,
    processes it through the pipeline, and returns the training recommendation.
    """
    try:
        # Convert Pydantic schemas back to standard Python dicts for the teammate's functions
        raw_zepp = payload.zepp_sleep.model_dump()
        raw_profile = payload.profile.model_dump()
        
        # 1. Transform raw Zepp fields & apply deep/REM sleep penalties
        model_input = from_zepp_api(raw_zepp, raw_profile)
        
        # 2. Feed the normalized features straight into the Random Forest model
        prediction_results = predictor.predict(model_input)
        
        return {
            "success": True,
            "data": prediction_results
        }
        
    except FileNotFoundError as fnf:
        # Caught if the .pkl model files aren't in the models/ directory
        raise HTTPException(status_code=500, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")