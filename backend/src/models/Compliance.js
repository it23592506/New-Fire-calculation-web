const { getDB } = require("../config/db");

const mapChecklist = (row) => ({
  _id: row.id,
  userId: row.user_id,
  teamId: row.team_id,
  reportId: row.report_id,
  name: row.name,
  country: row.country,
  standardCode: row.standard_code,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapItem = (row) => ({
  _id: row.id,
  checklistId: row.checklist_id,
  clause: row.clause,
  requirement: row.requirement,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const createChecklist = async ({ userId, teamId, reportId, name, country, standardCode, items }) => {
  const db = getDB();
  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO compliance_checklists
      (user_id, team_id, report_id, name, country, standard_code, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'in-progress', ?, ?)
    `,
    [userId, teamId || null, reportId || null, name, country || null, standardCode || null, now, now]
  );

  for (const item of items) {
    await db.run(
      `
        INSERT INTO compliance_items
        (checklist_id, clause, requirement, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [result.lastID, item.clause || null, item.requirement, item.status || "pending", item.notes || null, now, now]
    );
  }

  const row = await db.get("SELECT * FROM compliance_checklists WHERE id = ?", [result.lastID]);
  return mapChecklist(row);
};

const listByUser = async (userId) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT *
      FROM compliance_checklists
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
    `,
    [userId]
  );
  return rows.map(mapChecklist);
};

const findChecklistById = async ({ checklistId, userId }) => {
  const db = getDB();
  const row = await db.get(
    `
      SELECT *
      FROM compliance_checklists
      WHERE id = ? AND user_id = ?
    `,
    [checklistId, userId]
  );
  return row ? mapChecklist(row) : null;
};

const listItems = async (checklistId) => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT *
      FROM compliance_items
      WHERE checklist_id = ?
      ORDER BY id ASC
    `,
    [checklistId]
  );
  return rows.map(mapItem);
};

const updateItem = async ({ checklistId, itemId, status, notes }) => {
  const db = getDB();
  const now = new Date().toISOString();
  await db.run(
    `
      UPDATE compliance_items
      SET status = ?, notes = ?, updated_at = ?
      WHERE id = ? AND checklist_id = ?
    `,
    [status, notes || null, now, itemId, checklistId]
  );
};

const refreshChecklistStatus = async (checklistId) => {
  const db = getDB();
  const rows = await db.all(
    `SELECT status FROM compliance_items WHERE checklist_id = ?`,
    [checklistId]
  );

  const hasFail = rows.some((row) => row.status === "fail");
  const hasPending = rows.some((row) => row.status === "pending");
  const nextStatus = hasFail ? "attention" : hasPending ? "in-progress" : "pass";

  await db.run(
    `UPDATE compliance_checklists SET status = ?, updated_at = ? WHERE id = ?`,
    [nextStatus, new Date().toISOString(), checklistId]
  );

  return nextStatus;
};

module.exports = {
  createChecklist,
  listByUser,
  findChecklistById,
  listItems,
  updateItem,
  refreshChecklistStatus
};
