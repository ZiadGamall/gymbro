const mongoose = require("mongoose");

const connectdb = async () => {
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL is missing from environment variables");
    process.exit(1);
  }

  const startedAt = Date.now();
  const mongoTimeoutMs = Number(process.env.MONGO_TIMEOUT_MS) || 30000;

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: mongoTimeoutMs,
    });

    console.log(`DB connected in ${Date.now() - startedAt}ms`);
  } catch (error) {
    console.error(`DB connection failed after ${Date.now() - startedAt}ms`);
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectdb;
