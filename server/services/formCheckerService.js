const fs = require("fs");

exports.forwardVideoToAI = async (videoPath, mode = "Beginner") => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(videoPath);
    const blob = new Blob([fileBuffer], { type: "video/mp4" });
    formData.append("video", blob, "video.mp4");

    const response = await fetch(
      `http://localhost:8000/analyze-form?mode=${mode}`,
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
