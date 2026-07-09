const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

let aiClient;

const getAiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
};

const NUTRITION_PROMPT = `
You are a nutrition expert analyzing a meal photo.

Identify every food item visible in the image and estimate its nutritional content based on typical portion sizes visible.

For identical images, produce identical estimates whenever possible.

Use conservative assumptions.

Do not guess ingredients that are not clearly visible.

If portion size is uncertain, estimate the median portion rather than a range.

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation. Just the raw JSON.

Use this exact structure:
{
  "food_items": ["item1", "item2"],
  "estimated_weight_g": 180,
  "total_calories": 000,
  "protein_g": 00,
  "carbs_g": 00,
  "fat_g": 00,
  "portion_note": "brief note about portion size assumptions",
  "confidence": "high/medium/low"
}

If the image does not contain food, return:
{
  "error": "No food detected in image"
}
`;

const removeUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to remove uploaded food image:", error.message);
  }
};

async function analyzeFoodImage(imageBuffer, mimeType = "image/jpeg") {
  try {
    const imageBase64 = imageBuffer.toString("base64");
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
        {
          text: NUTRITION_PROMPT,
        },
      ],
      config: { temperature: 0 },
    });

    let raw = response.text;

    raw = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(raw);
  } catch (error) {
    console.error(error);

    return {
      error: "Failed to analyze image",
    };
  }
}

exports.analyzeFoodImage = analyzeFoodImage;

exports.analyzeUploadedFoodImage = catchAsync(async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload an image file.", 400));
    }

    if (!process.env.GEMINI_API_KEY) {
      return next(
        new AppError("Food analysis service is not configured.", 503),
      );
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const result = await analyzeFoodImage(imageBuffer, req.file.mimetype);

    if (result.error) {
      return res.status(502).json({
        status: "fail",
        message: result.error,
      });
    }

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } finally {
    removeUploadedFile(req.file?.path);
  }
});
