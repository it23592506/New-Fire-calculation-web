const express = require("express");
const auth = require("../middleware/auth");
const Compliance = require("../models/Compliance");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

const templateLibrary = [
  {
    id: "nfpa-basic",
    name: "NFPA Basic Facility Checklist",
    country: "US",
    standardCode: "NFPA",
    items: [
      { clause: "NFPA-01", requirement: "Exit paths are unobstructed and signed." },
      { clause: "NFPA-02", requirement: "Portable extinguishers are accessible and inspected." },
      { clause: "NFPA-03", requirement: "Alarm systems are tested and documented." },
      { clause: "NFPA-04", requirement: "Emergency lighting is functional in critical routes." },
      { clause: "NFPA-05", requirement: "Drill records are available for audit." }
    ]
  },
  {
    id: "industrial-process",
    name: "Industrial Process Fire Safety",
    country: "Global",
    standardCode: "Process-Safety",
    items: [
      { clause: "PS-01", requirement: "Hot-work permits are active and validated." },
      { clause: "PS-02", requirement: "Combustible storage segregation is enforced." },
      { clause: "PS-03", requirement: "Hydrant and suppression systems pass recent tests." },
      { clause: "PS-04", requirement: "Electrical hazard isolation controls are maintained." },
      { clause: "PS-05", requirement: "Near-miss findings are tracked to closure." }
    ]
  }
];

const validStatuses = ["pending", "pass", "fail", "na"];

router.get("/compliance/templates", auth, async (_req, res) => {
  return res.json(templateLibrary);
});

router.post("/compliance/checklists", auth, async (req, res) => {
  const {
    templateId,
    name,
    country,
    standardCode,
    reportId,
    teamId,
    items: customItems = []
  } = req.body || {};

  let payloadItems = customItems;
  let finalName = name?.trim();
  let finalCountry = country?.trim();
  let finalStandard = standardCode?.trim();

  if (templateId) {
    const template = templateLibrary.find((item) => item.id === templateId);
    if (!template) {
      return res.status(400).json({ message: "Invalid templateId" });
    }
    payloadItems = template.items;
    finalName = finalName || template.name;
    finalCountry = finalCountry || template.country;
    finalStandard = finalStandard || template.standardCode;
  }

  if (!finalName) {
    return res.status(400).json({ message: "Checklist name is required" });
  }

  if (!Array.isArray(payloadItems) || payloadItems.length === 0) {
    return res.status(400).json({ message: "At least one checklist item is required" });
  }

  const normalizedItems = payloadItems.map((item) => ({
    clause: item.clause || null,
    requirement: String(item.requirement || "").trim(),
    status: validStatuses.includes(item.status) ? item.status : "pending",
    notes: item.notes || null
  }));

  if (normalizedItems.some((item) => !item.requirement)) {
    return res.status(400).json({ message: "Each checklist item requires text" });
  }

  const checklist = await Compliance.createChecklist({
    userId: req.user.id,
    teamId,
    reportId,
    name: finalName,
    country: finalCountry,
    standardCode: finalStandard,
    items: normalizedItems
  });

  await AuditLog.create({
    userId: req.user.id,
    action: "compliance.checklist.create",
    entityType: "compliance_checklist",
    entityId: checklist._id,
    metadata: { itemCount: normalizedItems.length, standardCode: finalStandard }
  });

  return res.status(201).json(checklist);
});

router.get("/compliance/checklists", auth, async (req, res) => {
  const checklists = await Compliance.listByUser(req.user.id);
  return res.json(checklists);
});

router.get("/compliance/checklists/:id", auth, async (req, res) => {
  const checklistId = Number(req.params.id);
  const checklist = await Compliance.findChecklistById({ checklistId, userId: req.user.id });
  if (!checklist) {
    return res.status(404).json({ message: "Checklist not found" });
  }
  const items = await Compliance.listItems(checklistId);
  return res.json({ checklist, items });
});

router.patch("/compliance/checklists/:id/items/:itemId", auth, async (req, res) => {
  const checklistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const status = req.body?.status;
  const notes = req.body?.notes;

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid item status" });
  }

  const checklist = await Compliance.findChecklistById({ checklistId, userId: req.user.id });
  if (!checklist) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  await Compliance.updateItem({ checklistId, itemId, status, notes });
  const aggregateStatus = await Compliance.refreshChecklistStatus(checklistId);

  await AuditLog.create({
    userId: req.user.id,
    action: "compliance.item.update",
    entityType: "compliance_item",
    entityId: itemId,
    metadata: { checklistId, status }
  });

  const items = await Compliance.listItems(checklistId);
  return res.json({ status: aggregateStatus, items });
});

router.get("/compliance/checklists/:id/summary", auth, async (req, res) => {
  const checklistId = Number(req.params.id);
  const checklist = await Compliance.findChecklistById({ checklistId, userId: req.user.id });
  if (!checklist) {
    return res.status(404).json({ message: "Checklist not found" });
  }

  const items = await Compliance.listItems(checklistId);
  const counts = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { pending: 0, pass: 0, fail: 0, na: 0 }
  );

  return res.json({
    checklist,
    totals: {
      total: items.length,
      pass: counts.pass,
      fail: counts.fail,
      pending: counts.pending,
      na: counts.na
    },
    gapHighlights: items
      .filter((item) => item.status === "fail")
      .map((item) => ({ clause: item.clause, requirement: item.requirement, notes: item.notes }))
  });
});

module.exports = router;
