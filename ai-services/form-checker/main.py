from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse
import cv2
import importlib.util
import os
import re
import shutil
import tempfile
from datetime import datetime, timezone
import numpy as np

from utils import get_mediapipe_pose

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "processed_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def _load_symbol(module_name, relative_path, symbol_name):
    module_path = os.path.join(BASE_DIR, relative_path)
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, symbol_name)


ProcessFrameSquat = _load_symbol(
    "form_checker_squat_process_frame",
    os.path.join("Squat", "process_frame_squat.py"),
    "ProcessFrame",
)
get_squat_thresholds_beginner = _load_symbol(
    "form_checker_squat_thresholds_beginner",
    os.path.join("Squat", "thresholds_squat.py"),
    "get_thresholds_beginner",
)
get_squat_thresholds_pro = _load_symbol(
    "form_checker_squat_thresholds_pro",
    os.path.join("Squat", "thresholds_squat.py"),
    "get_thresholds_pro",
)

ProcessFrameBicepCurls = _load_symbol(
    "form_checker_bicep_process_frame",
    os.path.join("Biceps Curl", "process_frame_bicep_curls.py"),
    "ProcessFrameBicepCurls",
)
get_bicep_thresholds_beginner = _load_symbol(
    "form_checker_bicep_thresholds_beginner",
    os.path.join("Biceps Curl", "thresholds_bicep_curls.py"),
    "get_thresholds_beginner",
)
get_bicep_thresholds_pro = _load_symbol(
    "form_checker_bicep_thresholds_pro",
    os.path.join("Biceps Curl", "thresholds_bicep_curls.py"),
    "get_thresholds_pro",
)

ProcessFrameShoulderPress = _load_symbol(
    "form_checker_shoulder_process_frame",
    os.path.join("Shoulder press", "process_frame_shoulder_press.py"),
    "ProcessFrameShoulderPress",
)
get_shoulder_thresholds_beginner = _load_symbol(
    "form_checker_shoulder_thresholds_beginner",
    os.path.join("Shoulder press", "thresholds_shoulder_press.py"),
    "get_thresholds_beginner",
)
get_shoulder_thresholds_pro = _load_symbol(
    "form_checker_shoulder_thresholds_pro",
    os.path.join("Shoulder press", "thresholds_shoulder_press.py"),
    "get_thresholds_pro",
)

EXERCISES = {
    "squats": {
        "label": "Squats",
        "processor": ProcessFrameSquat,
        "beginner_thresholds": get_squat_thresholds_beginner,
        "pro_thresholds": get_squat_thresholds_pro,
        "correct_key": "SQUAT_COUNT",
        "incorrect_key": "IMPROPER_SQUAT",
        "prompt_flags": {"LOWER_HIPS": "LOWER YOUR HIPS"},
    },
    "biceps-curl": {
        "label": "Biceps Curl",
        "processor": ProcessFrameBicepCurls,
        "beginner_thresholds": get_bicep_thresholds_beginner,
        "pro_thresholds": get_bicep_thresholds_pro,
        "correct_key": "CURL_COUNT",
        "incorrect_key": "IMPROPER_CURL",
        "prompt_flags": {"CURL_MORE": "CURL MORE"},
    },
    "shoulder-press": {
        "label": "Shoulder Press",
        "processor": ProcessFrameShoulderPress,
        "beginner_thresholds": get_shoulder_thresholds_beginner,
        "pro_thresholds": get_shoulder_thresholds_pro,
        "correct_key": "PRESS_COUNT",
        "incorrect_key": "IMPROPER_PRESS",
        "prompt_flags": {"PRESS_HIGHER": "PRESS HIGHER"},
    },
}


def normalize_exercise(value):
    exercise = (value or "squats").strip().lower().replace("_", "-")
    aliases = {
        "squat": "squats",
        "squats": "squats",
        "bicep-curl": "biceps-curl",
        "bicep-curls": "biceps-curl",
        "biceps-curl": "biceps-curl",
        "biceps-curls": "biceps-curl",
        "biceps curl": "biceps-curl",
        "biceps curls": "biceps-curl",
        "shoulder press": "shoulder-press",
        "shoulder-press": "shoulder-press",
    }
    return aliases.get(exercise, exercise)


def get_thresholds_for_mode(config, mode):
    return (
        config["beginner_thresholds"]()
        if mode == "Beginner"
        else config["pro_thresholds"]()
    )


def get_upload_suffix(filename):
    _, ext = os.path.splitext(filename or "")
    return ext if ext else ".mp4"


def safe_filename_part(value, fallback):
    cleaned = re.sub(r"[^a-zA-Z0-9-]+", "-", value or "").strip("-")
    return cleaned or fallback


def build_output_filename(user_id, exercise):
    safe_user = safe_filename_part(user_id, "anonymous")
    safe_exercise = safe_filename_part(exercise, "exercise")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{safe_user}-{timestamp}-{safe_exercise}.mp4"

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "GymBro Form Checker",
        "exercises": [config["label"] for config in EXERCISES.values()],
    }

@app.post("/analyze-form")
async def analyze_form(
    mode: str = Query("Beginner"),
    exercise: str = Query("squats"),
    user_id: str = Query("anonymous"),
    video: UploadFile = File(...),
):
    temp_path = None
    vf = None
    video_output = None
    pose = None
    try:
        normalized_exercise = normalize_exercise(exercise)
        if normalized_exercise not in EXERCISES:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Unsupported exercise: {exercise}",
                    "supported_exercises": list(EXERCISES.keys()),
                },
            )

        mode = "Pro" if mode == "Pro" else "Beginner"
        exercise_config = EXERCISES[normalized_exercise]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=get_upload_suffix(video.filename),
        ) as tfile:
            shutil.copyfileobj(video.file, tfile)
            temp_path = tfile.name

        vf = cv2.VideoCapture(temp_path)
        if not vf.isOpened():
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Could not read uploaded video."},
            )

        fps = int(vf.get(cv2.CAP_PROP_FPS)) or 30
        width = int(vf.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(vf.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width <= 0 or height <= 0:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Uploaded video has no readable frames."},
            )

        frame_size = (width, height)
        
        output_filename = build_output_filename(user_id, normalized_exercise)
        output_video_path = os.path.join(OUTPUT_DIR, output_filename)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_output = cv2.VideoWriter(output_video_path, fourcc, fps, frame_size)
        if not video_output.isOpened():
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Could not create processed output video."},
            )

        thresholds = get_thresholds_for_mode(exercise_config, mode)
        pose = get_mediapipe_pose()
        processor = exercise_config["processor"](thresholds=thresholds)

        # Initialize an object to track errors per rep
        rep_errors_log = {}
        
        # Keep track of the last seen incorrect count to know when a new bad rep finishes
        last_incorrect_count = 0
        current_frame_errors = set()
        incorrect_key = exercise_config["incorrect_key"]
        correct_key = exercise_config["correct_key"]

        while vf.isOpened():
            ret, frame = vf.read()
            if not ret:
                break
            
            # Run tracking processing logic
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            out_frame, _ = processor.process(frame_rgb, pose)
            video_output.write(out_frame[..., ::-1])

            # Extract internal count states
            current_incorrect_count = processor.state_tracker.get(incorrect_key, 0)
            display_flags = processor.state_tracker.get('DISPLAY_TEXT', np.array([]))
            
            # Accumulate form violations while the user is performing the movement
            for idx in np.where(display_flags)[0]:
                if idx in processor.FEEDBACK_ID_MAP:
                    current_frame_errors.add(processor.FEEDBACK_ID_MAP[idx][0])
            
            for flag, message in exercise_config["prompt_flags"].items():
                if processor.state_tracker.get(flag, False):
                    current_frame_errors.add(message)

            # If the incorrect rep counter goes up, log the errors gathered for this rep
            if current_incorrect_count > last_incorrect_count:
                rep_key = f"rep {current_incorrect_count}"
                # Save collected flags as a list (or string joined by comma if you prefer)
                rep_errors_log[rep_key] = list(current_frame_errors)
                
                # Reset tracking values for the next improper rep sequence
                last_incorrect_count = current_incorrect_count
                current_frame_errors = set()
                
            # Keep clearing out the window if the state transitions cleanly back to standing
            if processor.state_tracker.get('curr_state') == 's1' and not processor.state_tracker.get('INCORRECT_POSTURE'):
                current_frame_errors = set()

        correct_count = processor.state_tracker.get(correct_key, 0)
        incorrect_count = processor.state_tracker.get(incorrect_key, 0)

        return {
            "success": True,
            "exercise": exercise_config["label"],
            "mode": mode,
            "correct_reps": int(correct_count),
            "incorrect_reps": int(incorrect_count),
            "errors_detected": rep_errors_log, # Returns {"rep 1": ["BEND FORWARD"], "rep 2": ["SQUAT TOO DEEP"]}
            "output_video": output_filename 
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
    finally:
        if vf is not None:
            vf.release()
        if video_output is not None:
            video_output.release()
        if pose is not None and hasattr(pose, "close"):
            pose.close()
        await video.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
