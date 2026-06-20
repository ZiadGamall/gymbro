const Groq = require("groq-sdk");
const toolHandlers = require("./fitbotTools");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. SYSTEM PROMPT BUILDER
const buildSystemPrompt = (user) => {
  const limitations = user.limitations || "None";

  return `
You are FitBot, an expert AI fitness trainer and nutritionist built into a gym management app. You are encouraging, precise, and safety-conscious.

USER PROFILE CONTEXT:
- Name: ${user.firstName}
- Age: ${user.age}
- Goal: ${user.goal}
- Experience: ${user.experience}
- Limitations/Injuries: ${limitations}

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
];

// 3. THE MAIN MULTI-STEP RESPONSE ENGINE
const generateFitbotResponse = async (user, history = [], message) => {
  const systemPrompt = buildSystemPrompt(user);

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
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: tools,
    });

    responseMessage = response.choices[0].message;

    // If Groq just wants to speak normally without tools, break the loop
    if (!responseMessage.tool_calls) {
      processingTools = false;
      break;
    }

    // Append Groq's tool-call intent to history
    messages.push(responseMessage);

    // Execute requested tools sequentially or in parallel
    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      let functionResult;

      // Delegate data fetching/creation straight to our controller bridges
      if (functionName === "searchExercises") {
        functionResult = await toolHandlers.handleSearchExercises(functionArgs);
      } else if (functionName === "createWorkout") {
        functionResult = await toolHandlers.handleCreateWorkout(
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
