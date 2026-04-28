const { getDB } = require("../config/db");

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    badgeType: row.badge_type,
    title: row.title,
    description: row.description,
    iconEmoji: row.icon_emoji,
    earnedAt: row.earned_at,
    createdAt: row.created_at
  };
};

const badgeDefinitions = [
  { type: "quiz-master", title: "Quiz Master", description: "Completed all 10 quizzes", iconEmoji: "🎓" },
  { type: "high-score", title: "High Scorer", description: "Scored 85%+ on any quiz", iconEmoji: "⭐" },
  { type: "perfect-10", title: "Perfect Score", description: "Achieved 10/10 on any quiz", iconEmoji: "🏆" },
  { type: "first-report", title: "First Report", description: "Generated your first calculation report", iconEmoji: "📄" },
  { type: "compliance-hero", title: "Compliance Hero", description: "Completed a compliance checklist", iconEmoji: "✅" },
  { type: "team-builder", title: "Team Builder", description: "Created your first team", iconEmoji: "👥" },
  { type: "early-adopter", title: "Early Adopter", description: "Used 5 different features", iconEmoji: "🚀" }
];

const createBadge = async ({ userId, badgeType }) => {
  const db = getDB();
  const badgeDef = badgeDefinitions.find((b) => b.type === badgeType);
  if (!badgeDef) {
    throw new Error("Invalid badge type");
  }

  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO badges (user_id, badge_type, title, description, icon_emoji, earned_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, badgeType, badgeDef.title, badgeDef.description, badgeDef.iconEmoji, now, now]
  );

  const row = await db.get("SELECT * FROM badges WHERE id = ?", [result.lastID]);
  return mapRow(row);
};

const findByUserId = async (userId) => {
  const db = getDB();
  const rows = await db.all("SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC", [userId]);
  return rows.map(mapRow);
};

const hasUserBadge = async ({ userId, badgeType }) => {
  const db = getDB();
  const row = await db.get(
    "SELECT id FROM badges WHERE user_id = ? AND badge_type = ? LIMIT 1",
    [userId, badgeType]
  );
  return !!row;
};

const getLeaderboard = async (limit = 20) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT u.id, u.name, u.email, COUNT(b.id) as badge_count
      FROM users u
      LEFT JOIN badges b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY badge_count DESC
      LIMIT ?
    `,
    [limit]
  );

  return rows.map((row) => ({
    userId: row.id,
    userName: row.name,
    userEmail: row.email,
    badgeCount: row.badge_count || 0
  }));
};

module.exports = {
  badgeDefinitions,
  createBadge,
  findByUserId,
  hasUserBadge,
  getLeaderboard
};
