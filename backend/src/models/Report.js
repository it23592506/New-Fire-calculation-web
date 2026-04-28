const { getDB } = require("../config/db");

const mapReportRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    userId: row.user_id,
    title: row.title,
    calculatorType: row.calculator_type || 'fire',
    extinguisherType: row.extinguisher_type,
    templateName: row.template_name,
    logoUrl: row.logo_url,
    approverName: row.approver_name,
    signatureText: row.signature_text,
    revisionNo: row.revision_no || 1,
    clientName: row.client_name,
    exportedAt: row.exported_at,
    area: row.area,
    weight: row.weight,
    cv: row.cv,
    fireLoad: row.fire_load,
    extinguishers: row.extinguishers,
    hydrantFlowLpm: row.hydrant_flow_lpm,
    detectorCount: row.detector_count,
    riskCategory: row.risk_category,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const create = async ({
  userId,
  title,
  calculatorType,
  extinguisherType,
  area,
  weight,
  cv,
  fireLoad,
  extinguishers,
  hydrantFlowLpm,
  detectorCount,
  riskCategory
}) => {
  const db = getDB();
  const now = new Date().toISOString();
  const result = await db.run(
    `
      INSERT INTO reports (
        user_id,
        title,
        calculator_type,
        extinguisher_type,
        template_name,
        logo_url,
        approver_name,
        signature_text,
        revision_no,
        client_name,
        exported_at,
        area,
        weight,
        cv,
        fire_load,
        extinguishers,
        hydrant_flow_lpm,
        detector_count,
        risk_category,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      title,
      calculatorType || 'fire',
      extinguisherType || null,
      null,
      null,
      null,
      null,
      1,
      null,
      null,
      area,
      weight,
      cv,
      fireLoad,
      extinguishers,
      hydrantFlowLpm,
      detectorCount,
      riskCategory,
      now,
      now
    ]
  );

  const row = await db.get("SELECT * FROM reports WHERE id = ?", [result.lastID]);
  return mapReportRow(row);
};

const findByUserId = async (userId) => {
  const db = getDB();
  const rows = await db.all(
    "SELECT * FROM reports WHERE user_id = ? ORDER BY datetime(created_at) DESC",
    [userId]
  );
  return rows.map(mapReportRow);
};

const findByIdAndUserId = async (id, userId) => {
  const db = getDB();
  const row = await db.get("SELECT * FROM reports WHERE id = ? AND user_id = ?", [
    id,
    userId
  ]);
  return mapReportRow(row);
};

const deleteByIdAndUserId = async (id, userId) => {
  const db = getDB();
  const result = await db.run("DELETE FROM reports WHERE id = ? AND user_id = ?", [
    id,
    userId
  ]);
  return result.changes > 0;
};

const findAllWithUsers = async () => {
  const db = getDB();
  const rows = await db.all(
    `
      SELECT
        r.*,
        u.name AS user_name,
        u.email AS user_email
      FROM reports r
      JOIN users u ON u.id = r.user_id
      ORDER BY datetime(r.created_at) DESC
    `
  );

  return rows.map((row) => ({
    ...mapReportRow(row),
    userName: row.user_name,
    userEmail: row.user_email
  }));
};

const updateBuilderByIdAndUserId = async (id, userId, payload) => {
  const db = getDB();
  const now = new Date().toISOString();

  await db.run(
    `
      UPDATE reports
      SET
        template_name = ?,
        logo_url = ?,
        approver_name = ?,
        signature_text = ?,
        revision_no = ?,
        client_name = ?,
        exported_at = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
    [
      payload.templateName || null,
      payload.logoUrl || null,
      payload.approverName || null,
      payload.signatureText || null,
      Number.isFinite(payload.revisionNo) ? payload.revisionNo : 1,
      payload.clientName || null,
      payload.exportedAt || null,
      now,
      id,
      userId
    ]
  );

  const row = await db.get("SELECT * FROM reports WHERE id = ? AND user_id = ?", [id, userId]);
  return mapReportRow(row);
};

module.exports = {
  create,
  findByUserId,
  findByIdAndUserId,
  deleteByIdAndUserId,
  findAllWithUsers,
  updateBuilderByIdAndUserId
};
