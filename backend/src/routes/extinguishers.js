const express = require('express');
const router = express.Router();
const extinguisher = require('../utils/extinguisher');

// POST /api/extinguishers/calc
// body: { area, type, capacity, hazard }
router.post('/extinguishers/calc', (req, res) => {
  try {
    const { area, type, capacity, hazard } = req.body;
    const result = extinguisher.computeQuantity({ area, type, capacity, hazard });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// POST /api/extinguishers/recommend
// body: { area, hazard }
router.post('/extinguishers/recommend', (req, res) => {
  try {
    const { area, hazard } = req.body;
    const result = extinguisher.recommendByHazard(hazard, area);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = router;
