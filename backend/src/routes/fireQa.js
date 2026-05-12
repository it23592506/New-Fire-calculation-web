const express = require('express');
const router = express.Router();
const fireQa = require('../utils/fireQa');

// POST /api/fire/load
// body: { materials: [{ mass, calorific }, ...], area: optional }
router.post('/fire/load', (req, res) => {
  try {
    const { materials, area } = req.body;
    const result = fireQa.computeFireLoad(materials);
    if (area) {
      const density = fireQa.computeFireLoadDensity(result.Q, area);
      return res.json({ ...result, ...density });
    }
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = router;
