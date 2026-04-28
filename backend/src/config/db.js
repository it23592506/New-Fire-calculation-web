const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let db;

const connectDB = async () => {
  if (db) {
    return db;
  }

  const dbPath =
    process.env.SQLITE_DB_PATH || path.join(__dirname, "../../data/fire-safety.db");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      calculator_type TEXT DEFAULT 'fire',
      extinguisher_type TEXT,
      template_name TEXT,
      logo_url TEXT,
      approver_name TEXT,
      signature_text TEXT,
      revision_no INTEGER NOT NULL DEFAULT 1,
      client_name TEXT,
      exported_at TEXT,
      area REAL NOT NULL,
      weight REAL NOT NULL,
      cv REAL NOT NULL,
      fire_load REAL NOT NULL,
      extinguishers REAL NOT NULL,
      hydrant_flow_lpm REAL NOT NULL,
      detector_count REAL NOT NULL,
      risk_category TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'engineer',
      invited_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(invited_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS compliance_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      team_id INTEGER,
      report_id INTEGER,
      name TEXT NOT NULL,
      country TEXT,
      standard_code TEXT,
      status TEXT NOT NULL DEFAULT 'in-progress',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS compliance_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checklist_id INTEGER NOT NULL,
      clause TEXT,
      requirement TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(checklist_id) REFERENCES compliance_checklists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon_emoji TEXT,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_type),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const userColumns = await db.all("PRAGMA table_info(users)");
  const hasRoleColumn = userColumns.some((column) => column.name === "role");
  if (!hasRoleColumn) {
    await db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';");
  }

  const reportColumns = await db.all("PRAGMA table_info(reports)");
  const hasCalculatorType = reportColumns.some((column) => column.name === "calculator_type");
  if (!hasCalculatorType) {
    await db.exec("ALTER TABLE reports ADD COLUMN calculator_type TEXT DEFAULT 'fire';");
  }

  const hasExtinguisherType = reportColumns.some((column) => column.name === "extinguisher_type");
  if (!hasExtinguisherType) {
    await db.exec("ALTER TABLE reports ADD COLUMN extinguisher_type TEXT;");
  }

  const addReportColumnIfMissing = async (columnName, ddl) => {
    const currentReportColumns = await db.all("PRAGMA table_info(reports)");
    const exists = currentReportColumns.some((column) => column.name === columnName);
    if (!exists) {
      await db.exec(ddl);
    }
  };

  await addReportColumnIfMissing("template_name", "ALTER TABLE reports ADD COLUMN template_name TEXT;");
  await addReportColumnIfMissing("logo_url", "ALTER TABLE reports ADD COLUMN logo_url TEXT;");
  await addReportColumnIfMissing("approver_name", "ALTER TABLE reports ADD COLUMN approver_name TEXT;");
  await addReportColumnIfMissing("signature_text", "ALTER TABLE reports ADD COLUMN signature_text TEXT;");
  await addReportColumnIfMissing("revision_no", "ALTER TABLE reports ADD COLUMN revision_no INTEGER NOT NULL DEFAULT 1;");
  await addReportColumnIfMissing("client_name", "ALTER TABLE reports ADD COLUMN client_name TEXT;");
  await addReportColumnIfMissing("exported_at", "ALTER TABLE reports ADD COLUMN exported_at TEXT;");

  if (process.env.ADMIN_EMAIL) {
    await db.run("UPDATE users SET role = 'admin' WHERE lower(email) = lower(?)", [
      process.env.ADMIN_EMAIL
    ]);
  }

  console.log(`SQLite connected (${dbPath})`);
  return db;
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not initialized");
  }
  return db;
};

module.exports = { connectDB, getDB };
