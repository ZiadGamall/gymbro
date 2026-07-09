const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");
const connectdb = require("./config/db");
const errorHandler = require("./utils/errorHandler");

const userRoute = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const workoutSessionRoutes = require("./routes/workoutSessionRoutes");
const fitbotRoutes = require("./routes/fitbotRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const calorieRoutes = require("./routes/calorieRoutes");
const formCheckRoutes = require("./routes/formCheckRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");
const splitRoutes = require("./routes/splitRoutes");
const foodAnalysisRoutes = require("./routes/foodAnalysisRoutes");

const cors = require("cors");
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "").split(","),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error("Not allowed by CORS");
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
};

//middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/upload", express.static(path.join(__dirname, "uploads")));

//routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/food", foodRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/nutrition", nutritionRoutes);
app.use("/api/v1/workout-session", workoutSessionRoutes);
app.use("/api/v1/fitbot", fitbotRoutes);
app.use("/api/v1/workouts", workoutRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/calories", calorieRoutes);
app.use("/api/v1/form-check", formCheckRoutes);
app.use("/api/v1/status", recoveryRoutes);
app.use("/api/v1/split", splitRoutes);
app.use("/api/v1/foodAnalysis", foodAnalysisRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use(errorHandler);

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectdb();

  app.listen(port, () => {
    console.log(`server is running on ${port}`);
  });
};

startServer();
