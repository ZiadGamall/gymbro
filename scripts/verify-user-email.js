/**
 * Mark a registered user as email-verified (demo / QA bypass when Brevo unavailable).
 * Usage: node scripts/verify-user-email.js user@example.com
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/verify-user-email.js <email>");
  process.exit(1);
}

async function main() {
  const mongoose = require("mongoose");
  const User = require("../server/models/userModel");

  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 15000,
  });

  const user = await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      verifyToken: null,
      dateOfBirth: new Date("1995-06-15"),
      gender: "male",
      height: 175,
      weight: 72,
    },
    { new: true },
  );

  await mongoose.disconnect();

  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  console.log(`Verified: ${user.username} (${user.email})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
