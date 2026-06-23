const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const predictCalories = async (req, res) => {
  const errors = validatePredictBody(req.body);
  if (errors.length > 0) {
    return res.status(422).json({ error: 'Validation failed', details: errors });
  }

  const payload = {
    gender:     String(req.body.gender).toLowerCase(),
    age:        Number(req.body.age),
    height:     Number(req.body.height),
    weight:     Number(req.body.weight),
    duration:   Number(req.body.duration),
    heart_rate: Number(req.body.heart_rate),
  };

  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await mlRes.json();

    if (!mlRes.ok) return res.status(mlRes.status).json(data);

    return res.status(200).json(data);

  } catch (err) {
    console.error('[calorieController] ML service unreachable:', err.message);
    return res.status(503).json({ error: 'ML service unavailable. Please try again later.' });
  }
};

const checkHealth = async (req, res) => {
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/health`);
    const data  = await mlRes.json();
    return res.status(mlRes.ok ? 200 : 502).json(data);
  } catch (err) {
    return res.status(503).json({ status: 'ml_service_unreachable' });
  }
};

const validatePredictBody = (body) => {
  const errors = [];

  if (body.gender === undefined) {
    errors.push("'gender' is required");
  } else if (!['male', 'female'].includes(String(body.gender).toLowerCase())) {
    errors.push("'gender' must be 'male' or 'female'");
  }

  const numericFields = [
    { key: 'age',        min: 1,  max: 120, label: 'age (years)'    },
    { key: 'height',     min: 50, max: 250, label: 'height (cm)'    },
    { key: 'weight',     min: 10, max: 300, label: 'weight (kg)'    },
    { key: 'duration',   min: 1,  max: 300, label: 'duration (min)' },
    { key: 'heart_rate', min: 30, max: 220, label: 'heart_rate (bpm)' },
  ];

  for (const { key, min, max, label } of numericFields) {
    if (body[key] === undefined) {
      errors.push(`'${key}' is required`);
    } else {
      const val = Number(body[key]);
      if (isNaN(val)) {
        errors.push(`'${key}' must be a number`);
      } else if (val < min || val > max) {
        errors.push(`'${key}' must be between ${min} and ${max} (${label})`);
      }
    }
  }

  return errors;
};

module.exports = { predictCalories, checkHealth };