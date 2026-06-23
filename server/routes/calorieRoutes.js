const express = require('express');
const router  = express.Router();
const { predictCalories, checkHealth } = require('../controllers/calorieController');

router.post('/predict', predictCalories);
router.get('/health',   checkHealth);

module.exports = router;