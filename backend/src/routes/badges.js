const express = require("express");
const auth = require("../middleware/auth");
const Badge = require("../models/Badge");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

router.get("/badges", auth, async (req, res) => {
  const badges = await Badge.findByUserId(req.user.id);
  return res.json(badges);
});

router.get("/badges/leaderboard", auth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const leaderboard = await Badge.getLeaderboard(limit);
  return res.json(leaderboard);
});

router.post("/badges/award", auth, async (req, res) => {
  const badgeType = req.body?.badgeType;
  if (!badgeType) {
    return res.status(400).json({ message: "badgeType is required" });
  }

  const validType = Badge.badgeDefinitions.some((b) => b.type === badgeType);
  if (!validType) {
    return res.status(400).json({ message: "Invalid badge type" });
  }

  const existing = await Badge.hasUserBadge({ userId: req.user.id, badgeType });
  if (existing) {
    return res.status(409).json({ message: "User already has this badge" });
  }

  const badge = await Badge.createBadge({ userId: req.user.id, badgeType });
  await AuditLog.create({
    userId: req.user.id,
    action: "badge.earn",
    entityType: "badge",
    entityId: badge._id,
    metadata: { badgeType }
  });

  return res.status(201).json(badge);
});

router.get("/badges/definitions", async (_req, res) => {
  return res.json(Badge.badgeDefinitions);
});

module.exports = router;
