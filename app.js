require("dotenv").config();
const express = require("express");
const connectdb = require("./config/db");
const path = require("path");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");

const userRoute = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");

const cors = require("cors");
const app = express();

//connect DB
connectdb();

//middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/upload", express.static(path.join(__dirname, "uploads")));

//routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/food", foodRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    msg: err.message,
  });
});

//server
app.listen(process.env.PORT, () => {
  console.log(`server is running on ${process.env.PORT}`);
});
