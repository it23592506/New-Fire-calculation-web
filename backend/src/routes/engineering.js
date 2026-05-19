const express = require('express');
const router = express.Router();
const { calculate, calculators } = require('../utils/engineeringCalculations');

router.get('/engineering/modules', (_req, res) => {
  res.json({ modules: Object.keys(calculators) });
});

router.post('/engineering/calculate', (req, res) => {
  try {
    const { module, payload } = req.body;
    const result = calculate(module, payload || {});
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
