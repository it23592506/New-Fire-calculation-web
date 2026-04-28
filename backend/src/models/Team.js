const { getDB } = require("../config/db");

const mapTeam = (row) => ({
  _id: row.id,
  name: row.name,
  ownerUserId: row.owner_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapMember = (row) => ({
  _id: row.id,
  teamId: row.team_id,
  userId: row.user_id,
  role: row.role,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userName: row.user_name,
  userEmail: row.user_email
});

const createTeam = async ({ name, ownerUserId }) => {
  const db = getDB();
  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO teams (name, owner_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
    [name, ownerUserId, now, now]
  );

  await db.run(
    `
      INSERT INTO team_members (team_id, user_id, role, invited_by, created_at, updated_at)
      VALUES (?, ?, 'admin', ?, ?, ?)
    `,
    [result.lastID, ownerUserId, ownerUserId, now, now]
  );

  const row = await db.get("SELECT * FROM teams WHERE id = ?", [result.lastID]);
  return mapTeam(row);
};

const findUserTeams = async (userId) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT t.*
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.user_id = ?
      ORDER BY datetime(t.created_at) DESC
    `,
    [userId]
  );
  return rows.map(mapTeam);
};

const findTeamById = async (teamId) => {
  const db = getDB();
  const row = await db.get("SELECT * FROM teams WHERE id = ?", [teamId]);
  return row ? mapTeam(row) : null;
};

const getMembership = async ({ teamId, userId }) => {
  const db = getDB();
  return db.get(
    `SELECT * FROM team_members WHERE team_id = ? AND user_id = ?`,
    [teamId, userId]
  );
};

const addMember = async ({ teamId, userId, role, invitedBy }) => {
  const db = getDB();
  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO team_members (team_id, user_id, role, invited_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [teamId, userId, role, invitedBy, now, now]
  );

  const row = await db.get("SELECT * FROM team_members WHERE id = ?", [result.lastID]);
  return mapMember(row);
};

const updateMemberRole = async ({ teamId, userId, role }) => {
  const db = getDB();
  const now = new Date().toISOString();
  await db.run(
    `
      UPDATE team_members
      SET role = ?, updated_at = ?
      WHERE team_id = ? AND user_id = ?
    `,
    [role, now, teamId, userId]
  );
};

const removeMember = async ({ teamId, userId }) => {
  const db = getDB();
  const result = await db.run(
    `DELETE FROM team_members WHERE team_id = ? AND user_id = ?`,
    [teamId, userId]
  );
  return result.changes > 0;
};

const listMembers = async (teamId) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT tm.*, u.name AS user_name, u.email AS user_email
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY datetime(tm.created_at) ASC
    `,
    [teamId]
  );
  return rows.map(mapMember);
};

module.exports = {
  createTeam,
  findUserTeams,
  findTeamById,
  getMembership,
  addMember,
  updateMemberRole,
  removeMember,
  listMembers
};
