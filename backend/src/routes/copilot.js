const express = require("express");
const auth = require("../middleware/auth");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

const riskAdviceMap = {
  Low: {
    posture: "Current values indicate lower immediate fire-risk exposure.",
    actions: [
      "Maintain routine inspection cadence and keep records complete.",
      "Retain housekeeping controls and periodic evacuation drills.",
      "Review load assumptions quarterly to avoid drift in risk profile."
    ]
  },
  Medium: {
    posture: "This profile indicates moderate risk and should be monitored closely.",
    actions: [
      "Increase spot checks around extinguisher access and detector readiness.",
      "Run a focused refresher drill for first-response and evacuation flow.",
      "Review storage density and combustible management per zone."
    ]
  },
  High: {
    posture: "High-risk indicators require immediate control improvements.",
    actions: [
      "Prioritize corrective actions for suppression and detection coverage gaps.",
      "Escalate review to safety lead and assign dated corrective owners.",
      "Run scenario drills for worst-case zones within the next cycle."
    ]
  },
  Critical: {
    posture: "Critical risk status demands urgent mitigation and command oversight.",
    actions: [
      "Trigger immediate engineering review and temporary risk controls.",
      "Limit hazardous operations until minimum control baseline is restored.",
      "Execute incident command tabletop and emergency communication check now."
    ]
  }
};

const buildAdvice = ({ report, question }) => {
  const risk = report?.riskCategory || "Medium";
  const riskAdvice = riskAdviceMap[risk] || riskAdviceMap.Medium;
  const fireLoad = Number(report?.fireLoad || 0);
  const extinguishers = Number(report?.extinguishers || 0);
  const hydrantFlow = Number(report?.hydrantFlowLpm || 0);
  const detectors = Number(report?.detectorCount || 0);

  const explanation = [
    `Risk category is ${risk} based on current calculation output.`,
    `Fire load is ${fireLoad.toFixed(2)}, extinguisher count is ${extinguishers.toFixed(2)}, hydrant flow is ${hydrantFlow.toFixed(2)} LPM, and detector count is ${detectors.toFixed(2)}.`
  ].join(" ");

  const codeComplianceRecommendations = [
    "Verify extinguisher placement and travel distance against local fire code requirements.",
    "Confirm detector spacing and placement align with adopted detection standard for occupancy type.",
    "Validate hydrant residual pressure and flow documentation for the latest maintenance cycle."
  ];

  const nextActions = [...riskAdvice.actions];
  if (question && question.trim()) {
    nextActions.push(`Address requested focus: ${question.trim()}`);
  }

  return {
    posture: riskAdvice.posture,
    explanation,
    codeComplianceRecommendations,
    nextActions
  };
};

router.post("/copilot/advice", auth, async (req, res) => {
  const reportId = Number(req.body?.reportId);
  const question = req.body?.question || "";
  if (!reportId) {
    return res.status(400).json({ message: "reportId is required" });
  }

  const report = await Report.findByIdAndUserId(reportId, req.user.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const advice = buildAdvice({ report, question });
  await AuditLog.create({
    userId: req.user.id,
    action: "copilot.advice.generate",
    entityType: "report",
    entityId: reportId,
    metadata: { question }
  });

  return res.json({
    reportId,
    reportTitle: report.title,
    calculatorType: report.calculatorType,
    riskCategory: report.riskCategory,
    advice
  });
});

module.exports = router;
