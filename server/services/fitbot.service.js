const Groq = require("groq-sdk");
const toolHandlers = require("./fitbotTools");
const AppError = require("../utils/appError");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function groqChatWithRetry(params, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await groq.chat.completions.create(params);
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt === maxAttempts) break;
      await sleep(600 * attempt);
    }
  }
  const status = lastError?.status || lastError?.statusCode;
  if (status === 429) {
    throw new AppError(
      "FitBot is temporarily unavailable due to API quota limits. Please try again later.",
      429,
    );
  }
  throw new AppError(
    "FitBot is temporarily unavailable. Please try again in a moment.",
    502,
  );
}

// 1. SYSTEM PROMPT BUILDER
const buildSystemPrompt = (user, onboarding) => {
  return `
You are FitBot, an expert AI fitness trainer and nutritionist built into a gym management app. You are encouraging, precise, and safety-conscious.

USER PROFILE CONTEXT:
- Name: ${user.firstName}
- Age: ${user.age}
- Goal: ${onboarding?.goal || "general_health"}
- Experience Level: ${onboarding?.level || "beginner"}
- Activity Days Per Week: ${onboarding?.activityDays || 3}
- Diet Preference: ${onboarding?.dietPreference || "balanced"}
- Calorie Target: ${onboarding?.calorieTarget || 2200} kcal
- Protein Target: ${onboarding?.proteinTarget || 120}g
- Limitations/Injuries: ${onboarding?.limitations || "None"}

BOT CAPABILITIES:
1. Tailor workout plans to the user's specific goals and level.
2. Form corrections, macro/nutrition calculations, and motivation.
3. Redirect off-topic requests back to health and fitness.
4. For injuries or acute pain, always recommend seeing a physician.

CRITICAL WORKOUT LOGGING WORKFLOW:
- You have NO internal exercise IDs. If the user asks for a workout routine or to log exercises, you MUST use the 'searchExercises' tool first to find valid database entries.
- After receiving results, display the workout using clear markdown.
- STOP IMMEDIATELY and ask the user: "Would you like me to save this workout to your workout list?"
- DO NOT CALL 'createWorkout' during the same turn you suggest the workout.
- You are ONLY authorized to execute the 'createWorkout' tool if the user explicitly confirms (e.g., "Yes", "Save it", "Sure") in the following turn. Look at the chat history to populate the exact JSON parameters required.

CRITICAL MEAL LOGGING WORKFLOW:
- If the user wants to log a meal, use 'searchFood' first to find the foodId.
- Display the nutritional info and ask: "Would you like me to log this to your nutrition tracker?"
- Only call 'logMealEntry' after explicit confirmation.

CRITICAL SESSION LOGGING WORKFLOW:
- If the user wants to log a completed workout session, collect duration and all sets/reps/weights conversationally first.
- Confirm the full session details with the user before calling 'logWorkoutSession'.

CRITICAL SPLIT SAVING WORKFLOW:
- When recommending a split, use 'getSplits' to fetch options and suggest the best fit based on the user's goal and experience.
- Do NOT ask to save a split until the user has explicitly chosen one from the list.
- First let the user pick, then show the details, then ask to save.
- Display the split details clearly and ask: "Would you like me to save this split to your profile?"
- Only call 'saveSplit' after explicit confirmation.

CRITICAL FOOD SEARCHING WORKFLOW:
- When searching for food, always use single broad keywords (e.g. 'chicken', 'rice'). Never include cooking methods or descriptors in food searches.
- When using searchFood, if the results don't contain the exact item searched, tell the user the exact items found and ask them to pick one. NEVER make up nutritional information from memory. If the database returns no results, say "I couldn't find that item in our database" and suggest a broader search term.

CRITICAL FOOD LOGGING WORKFLOW:
- When searchFood returns results, ALWAYS display the top 3-5 results as a numbered list showing the exact food name from the database.
- Ask the user "Which one matches what you ate?"
- Once the user picks one, confirm the weight and meal type, then ask for confirmation before calling logMealEntry.
- NEVER summarize or paraphrase food names from the database. Show them exactly as returned.

CRITICAL NUTRITION PLAN WORKFLOW:
- When the user asks for a nutrition plan, generate a full day meal plan using their calorie, protein, carbs, and fat targets from their profile.
- Break the plan into breakfast, lunch, dinner, and snack(s).
- Display the plan clearly in a table with food suggestions, quantities, and macros per meal.
- Ask: "Would you like me to save this nutrition plan to your profile?"
- Only call 'saveNutritionPlan' after explicit confirmation.
- When generating food suggestions, use realistic foods that match the user's diet preference and allergies.

OUTPUT FORMAT STANDARD:
- Use clean Markdown styling (bolding, headers, lists).
- Display workouts clearly showing sets x reps formatting.
- Display macro/nutrition quantities using grams or standard fractions.
- Always conclude non-tool text responses with a single, highly motivating fitness statement.
`.trim();
};

// 2. DEFINE THE TOOLS GROQ CAN CALL
const tools = [
  {
    type: "function",
    function: {
      name: "searchExercises",
      description:
        "Query the internal exercise library to retrieve real DB records and unique ObjectIds.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description:
              "A single broad keyword describing the main targeted muscle group or body part. Examples: 'chest', 'back', 'legs', 'shoulders', 'arms'.",
          },
        },
        required: ["searchTerm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createWorkout",
      description:
        "Save a structured workout routine directly into the user's log database.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Name of the workout session, e.g., 'Chest & Triceps Focus'.",
          },
          numberOfExercises: {
            type: "number",
            description:
              "Total count of unique exercises added to the workout array.",
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exerciseId: {
                  type: "string",
                  description:
                    "The 24-character hexadecimal MongoDB ObjectId string found via searchExercises.",
                },
                sets: {
                  type: "string",
                  description: "Number of sets, e.g., '4' or '3-4'.",
                },
                repsPerSet: {
                  type: "string",
                  description: "Target reps per set, e.g., '10' or '8-12'.",
                },
              },
              required: ["exerciseId", "sets", "repsPerSet"],
            },
          },
        },
        required: ["numberOfExercises", "exercises"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getNutritionSummary",
      description:
        "Fetches the user's total calorie and macro intake for today from the database. Use when the user asks about their nutrition, macros, or calories for the day.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchFood",
      description:
        "Search the food database. ALWAYS search with a single broad word only: 'chicken', 'beef', 'rice'. Never use more than one word. Then pick the closest match from results returned.",
      parameters: {
        type: "object",
        properties: {
          foodName: {
            type: "string",
            description:
              "A single broad food keyword to search. Examples: 'chicken', 'rice', 'banana', 'oats'. Avoid adjectives or cooking methods.",
          },
        },
        required: ["foodName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "logMealEntry",
      description:
        "Log a food item the user has eaten into their nutrition tracker. Always use searchFood first to get the correct foodId before calling this.",
      parameters: {
        type: "object",
        properties: {
          foodId: {
            type: "string",
            description:
              "The MongoDB ObjectId of the food item retrieved from searchFood.",
          },
          weightConsumed: {
            type: "number",
            description: "The weight in grams the user consumed.",
          },
          mealType: {
            type: "string",
            enum: ["breakfast", "lunch", "dinner", "snack"],
            description: "The meal category.",
          },
        },
        required: ["foodId", "weightConsumed", "mealType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSplits",
      description:
        "Fetch all available training splits from the database. The result includes the user's goal, experience level, and how many days per week they can train. Use these to recommend the most suitable split. Match activityDays to the number of training days in the split, match level to split complexity, and match goal to split focus.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "logWorkoutSession",
      description:
        "Log a completed workout session with actual weights and reps performed. Use when the user wants to record a session they just finished.",
      parameters: {
        type: "object",
        properties: {
          workoutName: {
            type: "string",
            description: "Name of the workout session.",
          },
          duration: {
            type: "number",
            description: "Duration of the session in minutes.",
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exerciseId: {
                  type: "string",
                  description: "MongoDB ObjectId of the exercise.",
                },
                name: { type: "string", description: "Exercise name." },
                sets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      setNumber: { type: "number" },
                      weight: { type: "number", description: "Weight in kg." },
                      reps: { type: "number" },
                    },
                    required: ["setNumber", "weight", "reps"],
                  },
                },
              },
              required: ["name", "sets"],
            },
          },
        },
        required: ["duration", "exercises"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "saveSplit",
      description:
        "Save a recommended split to the user's profile after they confirm they want it.",
      parameters: {
        type: "object",
        properties: {
          splitId: {
            type: "string",
            description:
              "The MongoDB ObjectId of the split to save, retrieved from getSplits.",
          },
        },
        required: ["splitId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "saveNutritionPlan",
      description:
        "Save a generated nutrition plan to the user's profile after they confirm. The plan should be based on the user's calorie and macro targets from their onboarding profile.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Name of the nutrition plan e.g. 'High Protein Muscle Tone Plan'",
          },
          dailyCalorieTarget: { type: "number" },
          dailyProteinTarget: { type: "number" },
          dailyCarbsTarget: { type: "number" },
          dailyFatTarget: { type: "number" },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mealType: {
                  type: "string",
                  enum: ["breakfast", "lunch", "dinner", "snack"],
                },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      foodName: { type: "string" },
                      quantity: { type: "string" },
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
        required: ["meals", "dailyCalorieTarget"],
      },
    },
  },
];

// 3. THE MAIN MULTI-STEP RESPONSE ENGINE
const generateFitbotResponse = async (
  user,
  onboarding,
  history = [],
  message,
) => {
  const systemPrompt = buildSystemPrompt(user, onboarding);

  console.log(systemPrompt);

  const messages = [
    { role: "system", content: systemPrompt },

    // Clean the history entries here:
    // Clean the history entries safely:
    ...history.map((h) => {
      // 1. Normalize the role name safely. Handle cases where h.role might be missing
      let cleanRole = "user";
      if (h.role === "model" || h.role === "assistant") {
        cleanRole = "assistant";
      } else if (h.role === "tool") {
        cleanRole = "tool";
      } else if (h.role === "system") {
        cleanRole = "system";
      }

      // 2. Build the structural baseline message object
      const cleanMessage = {
        role: cleanRole,
        content: h.text || h.content || "",
      };

      // 3. Keep tool calling schemas clean only if they exist
      if (cleanRole === "assistant" && h.tool_calls) {
        cleanMessage.tool_calls = h.tool_calls;
      }

      if (cleanRole === "tool") {
        cleanMessage.tool_call_id = h.tool_call_id || "missing_id";
        cleanMessage.name = h.name || "unknown_tool";
      }

      return cleanMessage;
    }),
    { role: "user", content: message },
  ];

  let processingTools = true;
  let responseMessage;

  while (processingTools) {
    const response = await groqChatWithRetry({
      model: "openai/gpt-oss-120b",
      messages,
      tools: tools,
      tool_choice: "auto",
    });

    responseMessage = response.choices[0].message;
    console.log("Response Message: ", responseMessage);

    // If Groq just wants to speak normally without tools, break the loop
    if (!responseMessage.tool_calls) {
      processingTools = false;
      break;
    }

    // Append Groq's tool-call intent to history
    messages.push(responseMessage);

    // Execute requested tools sequentially or in parallel
    for (const toolCall of responseMessage.tool_calls) {
      console.log("Tool Call: ", toolCall);
      const functionName = toolCall.function.name;
      let functionArgs = {};
      try {
        functionArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        functionArgs = {};
      }
      let functionResult;

      // Delegate data fetching/creation straight to our controller bridges
      if (functionName === "searchExercises") {
        functionResult = await toolHandlers.handleSearchExercises(functionArgs);
      } else if (functionName === "createWorkout") {
        functionResult = await toolHandlers.handleCreateWorkout(
          functionArgs,
          user,
        );
      } else if (functionName === "getNutritionSummary") {
        functionResult = await toolHandlers.handleGetNutritionSummary(user);
      } else if (functionName === "searchFood") {
        functionResult = await toolHandlers.handleSearchFood(functionArgs);
      } else if (functionName === "logMealEntry") {
        functionResult = await toolHandlers.handleLogMealEntry(
          functionArgs,
          user,
        );
      } else if (functionName === "getSplits") {
        functionResult = await toolHandlers.handleGetSplits(user);
      } else if (functionName === "logWorkoutSession") {
        functionResult = await toolHandlers.handleLogWorkoutSession(
          functionArgs,
          user,
        );
      } else if (functionName === "saveSplit") {
        functionResult = await toolHandlers.handleSaveSplit(functionArgs, user);
      } else if (functionName === "saveNutritionPlan") {
        functionResult = await toolHandlers.handleSaveNutritionPlan(
          functionArgs,
          user,
        );
      } else {
        functionResult = { error: `Tool ${functionName} not recognized.` };
      }

      // Return the database data back into the conversational array
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: functionName,
        content: JSON.stringify(functionResult),
      });
    }
  }

  // Returns the final text response generated after handling all data actions
  return responseMessage.content;
};

module.exports = {
  buildSystemPrompt,
  generateFitbotResponse,
};
