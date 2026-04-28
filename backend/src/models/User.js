const { getDB } = require("../config/db");

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    password: row.password,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findByEmail = async (email) => {
  const db = getDB();
  const row = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  return mapUserRow(row);
};

const create = async ({ name, email, password, role = "user" }) => {
  const db = getDB();
  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, email, password, role, now, now]
  );

  const row = await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
  return mapUserRow(row);
};

const findById = async (id) => {
  const db = getDB();
  const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
  return mapUserRow(row);
};

const findPublicById = async (id) => {
  const db = getDB();
  const row = await db.get(
    "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  if (!row) {
    return null;
  }
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findPublicByEmail = async (email) => {
  const db = getDB();
  const row = await db.get(
    "SELECT id, name, email, role, created_at, updated_at FROM users WHERE lower(email) = lower(?)",
    [email]
  );
  if (!row) {
    return null;
  }
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findAll = async () => {
  const db = getDB();
  const rows = await db.all(
    "SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY datetime(created_at) DESC"
  );
  return rows.map((row) => ({
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

module.exports = { findByEmail, create, findById, findPublicById, findPublicByEmail, findAll };
