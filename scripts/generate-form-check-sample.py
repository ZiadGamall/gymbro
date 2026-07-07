"""Generate a minimal synthetic squat-like video for form-checker smoke tests."""
import os
import cv2
import numpy as np

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "ai-services", "form-checker", "test-fixtures")
OUT_PATH = os.path.join(OUT_DIR, "sample_squat.mp4")

os.makedirs(OUT_DIR, exist_ok=True)

width, height, fps = 640, 480, 10
frames = 30
writer = cv2.VideoWriter(
    OUT_PATH,
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (width, height),
)

for i in range(frames):
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (30, 30, 40)
    # Simple moving rectangle to simulate motion
    y = 200 + int(40 * np.sin(i / 5))
    cv2.rectangle(frame, (280, y), (360, y + 120), (200, 200, 220), -1)
    cv2.putText(frame, "GymBro Form Check Sample", (140, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    writer.write(frame)

writer.release()
print(OUT_PATH)
