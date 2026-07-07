require("dotenv").config({ path: require("path").join(__dirname, "../server/.env") });

async function main() {
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGO_URL);
  const User = require("../server/models/userModel");
  const axios = require("axios");

  const users = await User.find({ activeSplit: { $exists: true, $ne: null } })
    .limit(5)
    .select("username email activeSplit currentDayIndex");

  console.log("Users with activeSplit:", users.map((u) => u.username));

  if (users[0]) {
    const login = await axios.post("http://127.0.0.1:5000/api/v1/users/login", {
      username: users[0].username,
      password: "DemoPass123!",
    }).catch(async () => {
      return axios.post("http://127.0.0.1:5000/api/v1/users/login", {
        username: "gymbro_smoke",
        password: "SmokeTest123!",
      });
    });

    const token = login.data?.token;
    const res = await axios
      .get("http://127.0.0.1:5000/api/v1/split/today", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch((e) => e.response);
    console.log("split/today status:", res?.status, res?.data);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
