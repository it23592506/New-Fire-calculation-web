const express = require("express");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const User = require("../models/User");
const Report = require("../models/Report");

const router = express.Router();

router.get("/admin/users", auth, requireAdmin, async (_req, res) => {
  const users = await User.findAll();
  return res.json(users);
});

router.get("/admin/reports", auth, requireAdmin, async (_req, res) => {
  const reports = await Report.findAllWithUsers();
  return res.json(reports);
});

module.exports = router;
