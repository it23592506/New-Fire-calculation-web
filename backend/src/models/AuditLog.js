const { getDB } = require("../config/db");

const create = async ({ userId, action, entityType, entityId, metadata }) => {
  const db = getDB();
  await db.run(
    `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      userId || null,
      action,
      entityType,
      entityId ? String(entityId) : null,
      metadata ? JSON.stringify(metadata) : null,
      new Date().toISOString()
    ]
  );
};

const findRecentByUser = async (userId, limit = 50) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT *
      FROM audit_logs
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `,
    [userId, limit]
  );

  return rows.map((row) => ({
    _id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    createdAt: row.created_at
  }));
};

module.exports = { create, findRecentByUser };
