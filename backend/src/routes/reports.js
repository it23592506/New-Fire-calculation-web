const express = require("express");
const auth = require("../middleware/auth");
const Report = require("../models/Report");
const { calculateFireMetrics, calculateCustomMetrics } = require("../utils/calculations");
const { createReportPdf, createFullReportPdf } = require("../utils/pdf");
const { sendReportEmail } = require("../utils/email");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

const asPositiveNumber = (value, field) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a valid number`);
  }
  return parsed;
};

router.post("/calculate", auth, async (req, res) => {
  const { area, weight, cv, title } = req.body;

  try {
    const metrics = calculateFireMetrics({ area, weight, cv });
    const report = await Report.create({
      userId: req.user.id,
      title: title?.trim() || "Untitled Fire Safety Report",
      calculatorType: 'fire',
      ...metrics
    });

    await AuditLog.create({
      userId: req.user.id,
      action: "report.create",
      entityType: "report",
      entityId: report._id,
      metadata: { calculatorType: "fire" }
    });

    return res.status(201).json(report);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/calculate/custom", auth, async (req, res) => {
  try {
    const payload = req.body || {};
    const metrics = calculateCustomMetrics(payload);
    const report = await Report.create({
      userId: req.user.id,
      title: payload.title?.trim() || "Untitled Calculation Report",
      calculatorType: payload.calculatorType || 'fire',
      extinguisherType: metrics.feType || payload.extinguisherType,
      area: metrics.area,
      weight: metrics.weight,
      cv: metrics.cv,
      fireLoad: metrics.fireLoad,
      extinguishers: metrics.extinguishers,
      hydrantFlowLpm: metrics.hydrantFlowLpm,
      detectorCount: metrics.detectorCount,
      riskCategory: metrics.riskCategory || payload.riskCategory || "Medium"
    });

    await AuditLog.create({
      userId: req.user.id,
      action: "report.create",
      entityType: "report",
      entityId: report._id,
      metadata: { calculatorType: payload.calculatorType || "fire" }
    });

    return res.status(201).json({
      ...report,
      metrics
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/reports", auth, async (req, res) => {
  const reports = await Report.findByUserId(req.user.id);
  return res.json(reports);
});

router.get("/reports/full/pdf", auth, async (req, res) => {
  const reports = await Report.findByUserId(req.user.id);
  if (!reports.length) {
    return res.status(404).json({ message: "No reports found" });
  }

  const pdfBuffer = await createFullReportPdf(reports);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="full-fire-reports.pdf"');
  return res.send(pdfBuffer);
});

router.get("/reports/:id/pdf", auth, async (req, res) => {
  const report = await Report.findByIdAndUserId(req.params.id, req.user.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const pdfBuffer = await createReportPdf(report);

  await Report.updateBuilderByIdAndUserId(report._id, req.user.id, {
    templateName: report.templateName,
    logoUrl: report.logoUrl,
    approverName: report.approverName,
    signatureText: report.signatureText,
    revisionNo: report.revisionNo || 1,
    clientName: report.clientName,
    exportedAt: new Date().toISOString()
  });

  await AuditLog.create({
    userId: req.user.id,
    action: "report.export.pdf",
    entityType: "report",
    entityId: report._id,
    metadata: { type: "single" }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="fire-report-${report._id}.pdf"`
  );
  return res.send(pdfBuffer);
});

router.delete("/reports/:id", auth, async (req, res) => {
  const deleted = await Report.deleteByIdAndUserId(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ message: "Report not found" });
  }

  await AuditLog.create({
    userId: req.user.id,
    action: "report.delete",
    entityType: "report",
    entityId: req.params.id
  });

  return res.json({ message: "Report deleted successfully" });
});

router.post("/reports/:id/email", auth, async (req, res) => {
  const report = await Report.findByIdAndUserId(req.params.id, req.user.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const to = req.body?.email?.trim() || req.user.email;
  const pdfBuffer = await createReportPdf(report);
  await sendReportEmail({ to, report, pdfBuffer });

  await AuditLog.create({
    userId: req.user.id,
    action: "report.email",
    entityType: "report",
    entityId: report._id,
    metadata: { to }
  });

  return res.json({ message: `Report emailed to ${to}` });
});

router.patch("/reports/:id/builder", auth, async (req, res) => {
  const report = await Report.findByIdAndUserId(req.params.id, req.user.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const payload = req.body || {};
  const updated = await Report.updateBuilderByIdAndUserId(req.params.id, req.user.id, {
    templateName: payload.templateName,
    logoUrl: payload.logoUrl,
    approverName: payload.approverName,
    signatureText: payload.signatureText,
    revisionNo: Number(payload.revisionNo) || 1,
    clientName: payload.clientName,
    exportedAt: payload.exportedAt || report.exportedAt
  });

  await AuditLog.create({
    userId: req.user.id,
    action: "report.builder.update",
    entityType: "report",
    entityId: updated._id,
    metadata: {
      templateName: updated.templateName,
      revisionNo: updated.revisionNo
    }
  });

  return res.json(updated);
});

module.exports = router;
