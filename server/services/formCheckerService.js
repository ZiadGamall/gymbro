const fs = require("fs");
const path = require("path");

const FORM_CHECKER_URL =
  process.env.FORM_CHECKER_URL || "http://127.0.0.1:8000";

exports.forwardVideoToAI = async (
  videoPath,
  mode = "Beginner",
  exercise = "squats",
  userId = "anonymous",
  metadata = {},
) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(videoPath);
    const filename = metadata.originalname || path.basename(videoPath);
    const mimeType = metadata.mimetype || "application/octet-stream";
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("video", blob, filename);

    const params = new URLSearchParams({ mode, exercise, user_id: userId });
    const response = await fetch(
      `${FORM_CHECKER_URL}/analyze-form?${params.toString()}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `FastAPI responded with status ${response.status}: ${errorText}`,
      );
    }

    // CRITICAL FIX: Explicitly await the parsed JSON payload
    const data = await response.json();

    if (!data) {
      throw new Error("FastAPI returned an empty response.");
    }

    return data;
  } catch (error) {
    console.error("Error inside formCheckerService:", error.message);
    throw error; // Pass the exact error up to your controller
  }
};
