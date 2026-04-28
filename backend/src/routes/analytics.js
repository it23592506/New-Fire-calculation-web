const express = require("express");
const auth = require("../middleware/auth");
const Report = require("../models/Report");
const Compliance = require("../models/Compliance");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

router.get("/analytics/overview", auth, async (req, res) => {
  const reports = await Report.findByUserId(req.user.id);
  const checklists = await Compliance.listByUser(req.user.id);
  const logs = await AuditLog.findRecentByUser(req.user.id, 100);

  const reportCount = reports.length;
  const fireReports = reports.filter((report) => report.calculatorType === "fire");
  const avgFireLoad = fireReports.length
    ? Number((fireReports.reduce((sum, item) => sum + Number(item.fireLoad || 0), 0) / fireReports.length).toFixed(2))
    : 0;
  const riskCounts = reports.reduce(
    (acc, report) => {
      const key = report.riskCategory || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  const checklistStatus = checklists.reduce(
    (acc, checklist) => {
      acc[checklist.status] = (acc[checklist.status] || 0) + 1;
      return acc;
    },
    {}
  );

  res.json({
    generatedAt: new Date().toISOString(),
    reports: {
      total: reportCount,
      averageFireLoad: avgFireLoad,
      riskCounts
    },
    compliance: {
      total: checklists.length,
      statusCounts: checklistStatus
    },
    activity: {
      last7Days: logs.filter((log) => Date.now() - new Date(log.createdAt).getTime() < 7 * 24 * 3600 * 1000).length,
      recent: logs.slice(0, 10)
    }
  });
});

module.exports = router;
