const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const GIFS_FOLDER = 'C:\\Users\\HP\\Downloads\\exercises-dataset\\videos';
const MONGODB_URI = 'mongodb+srv://omarezzat:10omarezzat11@cluster0.2lijqjt.mongodb.net/validation';

cloudinary.config({
  cloud_name: 'ddjf0yqzl',
  api_key: '224653844786764',
  api_secret: '5okzsfHK8p_5LJO7keKJLPuV5ns',
});

// ─── Exercise Model ────────────────────────────────────────────────────────────

const Exercise = mongoose.model('Exercise', new mongoose.Schema({
  id: String,
  name: String,
  gifUrl: String,
}, { strict: false }));

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 10;
const DELAY_MS   = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

const total = await Exercise.countDocuments();
console.log(`Total exercises in DB: ${total}`);

const exercises = await Exercise.find({
  gifUrl: { $not: /^https?:\/\// }
});

console.log(`Found ${exercises.length} exercises to upload\n`);

// Show first 3 gifUrl values to debug
const sample = await Exercise.find().limit(3).select('gifUrl');
console.log('Sample gifUrls:', sample.map(e => e.gifUrl));

  if (exercises.length === 0) {
    console.log('All exercises already have Cloudinary URLs. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  let success = 0;
  let failed  = 0;
  const errors = [];
  const startTime = Date.now();

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (exercise) => {
      const filename = path.basename(exercise.gifUrl);
      const filepath = path.join(GIFS_FOLDER, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`  ✗ File not found: ${filename}`);
        errors.push({ id: exercise.id, filename, reason: 'file not found' });
        failed++;
        return;
      }

      try {
        const result = await cloudinary.uploader.upload(filepath, {
          resource_type: 'image',
          folder: 'gymbro/exercises',
          public_id: path.parse(filename).name,
          overwrite: false,
        });

        await Exercise.updateOne(
          { _id: exercise._id },
          { $set: { gifUrl: result.secure_url } }
        );

        success++;
        console.log(`  ✓ [${success + failed}/${exercises.length}] ${filename}`);
      } catch (err) {
        console.log(`  ✗ Failed: ${filename} — ${err.message}`);
        errors.push({ id: exercise.id, filename, reason: err.message });
        failed++;
      }
    }));

    const elapsed = Date.now() - startTime;
    const done    = success + failed;
    const rate    = done / (elapsed / 1000);
    const remaining = Math.round((exercises.length - done) / rate * 1000);
    console.log(`\n  Progress: ${done}/${exercises.length} — ETA: ${formatTime(remaining)}\n`);

    if (i + BATCH_SIZE < exercises.length) await sleep(DELAY_MS);
  }

  const totalTime = formatTime(Date.now() - startTime);
  console.log('─'.repeat(50));
  console.log(`Done in ${totalTime}`);
  console.log(`  Uploaded: ${success}`);
  console.log(`  Failed:   ${failed}`);

  if (errors.length > 0) {
    const logPath = path.join(__dirname, 'upload-errors.json');
    fs.writeFileSync(logPath, JSON.stringify(errors, null, 2));
    console.log(`\n  Error details saved to: ${logPath}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});