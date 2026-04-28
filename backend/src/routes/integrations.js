const express = require("express");
const auth = require("../middleware/auth");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

router.post("/integrations/webhook/test", auth, async (req, res) => {
  const webhookUrl = req.body?.webhookUrl?.trim();
  if (!webhookUrl) {
    return res.status(400).json({ message: "webhookUrl is required" });
  }

  const payload = {
    source: "fire-safety-platform",
    event: "integration.test",
    triggeredBy: req.user.email,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    await AuditLog.create({
      userId: req.user.id,
      action: "integration.webhook.test",
      entityType: "integration",
      entityId: webhookUrl,
      metadata: { status: response.status }
    });

    return res.json({ message: "Webhook test sent", status: response.status });
  } catch (error) {
    return res.status(400).json({ message: `Webhook test failed: ${error.message}` });
  }
});

router.get("/integrations/export/:reportId", auth, async (req, res) => {
  const report = await Report.findByIdAndUserId(req.params.reportId, req.user.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  await AuditLog.create({
    userId: req.user.id,
    action: "integration.export.package",
    entityType: "report",
    entityId: report._id,
    metadata: { title: report.title }
  });

  return res.json({
    type: "report-export-package",
    exportedAt: new Date().toISOString(),
    report
  });
});

module.exports = router;
