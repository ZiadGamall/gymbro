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
You are a world-class nutrition expert and dietitian analyzing a meal photo.

Your task is to accurately identify every food item visible in the image and estimate its nutritional content (macros and calories) based on the visual portion size.

CRITICAL INSTRUCTIONS FOR ACCURACY AND CONSISTENCY:
1. REFERENCE STANDARD DATABASES: Base all nutritional estimates on standard USDA values.
2. PORTION SIZING (CRUCIAL): You cannot determine absolute scale from a 2D image. Therefore, ALWAYS assume standard, single-person portion sizes (typically 300g - 500g total for a meal) unless there is undeniable visual evidence of a multi-person platter. Never estimate extreme weights (like 800g-1000g for a single plate).
3. DRESSINGS & OILS: Be highly conservative with high-calorie dense items like mayonnaise, oils, and butter. Assume a standard 1-2 tablespoon serving (15-30g) for dressings/mayo unless clearly swimming in it.
4. MATH CHECK: Total calories MUST perfectly equal (protein_g * 4) + (carbs_g * 4) + (fat_g * 9).
5. BE CONSISTENT: For identical images, use the exact same standard assumptions.

You MUST think step-by-step in the "reasoning" field before providing the final numbers. Break down each food item, state its assumed standard weight in grams, state the macros per 100g, and calculate the total for that item.

Respond ONLY with a valid JSON object. No markdown, no backticks.

Use this exact JSON structure:
{
  "reasoning": "Step-by-step breakdown: 1. Chicken salad looks like a standard single serving (approx 250g). Chicken (150g) + Mayo (30g) + Celery/Onion (70g)...",
  "food_items": ["item1", "item2"],
  "estimated_weight_g": 350,
  "total_calories": 520,
  "protein_g": 35,
  "carbs_g": 10,
  "fat_g": 5,
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
      config: { 
        temperature: 0.1,
        responseMimeType: "application/json"
      },
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
