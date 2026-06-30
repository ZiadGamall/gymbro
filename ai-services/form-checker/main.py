from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse
import cv2
import os
import shutil
import tempfile
import numpy as np

from process_frame import ProcessFrame
from thresholds import get_thresholds_beginner, get_thresholds_pro
from utils import get_mediapipe_pose

app = FastAPI()

OUTPUT_DIR = "processed_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/analyze-form")
async def analyze_form(mode: str = Query("Beginner"), video: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tfile:
            shutil.copyfileobj(video.file, tfile)
            temp_path = tfile.name

        vf = cv2.VideoCapture(temp_path)
        fps = int(vf.get(cv2.CAP_PROP_FPS)) or 30
        width = int(vf.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(vf.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_size = (width, height)
        
        output_filename = f"processed_{os.path.basename(temp_path)}"
        output_video_path = os.path.join(OUTPUT_DIR, output_filename)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_output = cv2.VideoWriter(output_video_path, fourcc, fps, frame_size)

        if mode == 'Beginner':
            thresholds = get_thresholds_beginner()
        else:
            thresholds = get_thresholds_pro()

        pose = get_mediapipe_pose()
        processor = ProcessFrame(thresholds=thresholds)

        # Initialize an object to track errors per rep
        rep_errors_log = {}
        
        # Keep track of the last seen incorrect count to know when a new bad rep finishes
        last_incorrect_count = 0
        current_frame_errors = set()

        while vf.isOpened():
            ret, frame = vf.read()
            if not ret:
                break
            
            # Run tracking processing logic
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            out_frame, _ = processor.process(frame, pose)
            video_output.write(out_frame)

            # Extract internal count states
            current_incorrect_count = processor.state_tracker.get('IMPROPER_SQUAT', 0)
            display_flags = processor.state_tracker.get('DISPLAY_TEXT', np.array([]))
            
            # Accumulate form violations while the user is performing the movement
            for idx in np.where(display_flags)[0]:
                if idx in processor.FEEDBACK_ID_MAP:
                    current_frame_errors.add(processor.FEEDBACK_ID_MAP[idx][0])
            
            if processor.state_tracker.get('LOWER_HIPS', False):
                current_frame_errors.add('LOWER YOUR HIPS')

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

        vf.release()
        video_output.release()

        correct_count = processor.state_tracker.get('SQUAT_COUNT', 0)
        incorrect_count = processor.state_tracker.get('IMPROPER_SQUAT', 0)

        return {
            "success": True,
            "exercise": "Squats",
            "mode": mode,
            "correct_reps": int(correct_count),
            "incorrect_reps": int(incorrect_count),
            "errors_detected": rep_errors_log, # Returns {"rep 1": ["BEND FORWARD"], "rep 2": ["SQUAT TOO DEEP"]}
            "output_video": output_filename 
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})