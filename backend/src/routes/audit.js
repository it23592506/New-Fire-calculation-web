const express = require("express");
const auth = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

router.get("/audit/logs", auth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const logs = await AuditLog.findRecentByUser(req.user.id, limit);
  return res.json(logs);
});

module.exports = router;
