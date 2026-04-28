const express = require("express");
const auth = require("../middleware/auth");
const Team = require("../models/Team");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

const allowedTeamRoles = ["engineer", "reviewer", "admin"];

const requireTeamAdmin = async (teamId, userId) => {
  const membership = await Team.getMembership({ teamId, userId });
  if (!membership) {
    return { ok: false, status: 404, message: "Team not found or inaccessible" };
  }
  if (membership.role !== "admin") {
    return { ok: false, status: 403, message: "Team admin role required" };
  }
  return { ok: true, membership };
};

router.post("/teams", auth, async (req, res) => {
  const name = req.body?.name?.trim();
  if (!name) {
    return res.status(400).json({ message: "Team name is required" });
  }

  const team = await Team.createTeam({ name, ownerUserId: req.user.id });
  await AuditLog.create({
    userId: req.user.id,
    action: "team.create",
    entityType: "team",
    entityId: team._id,
    metadata: { name }
  });
  return res.status(201).json(team);
});

router.get("/teams", auth, async (req, res) => {
  const teams = await Team.findUserTeams(req.user.id);
  return res.json(teams);
});

router.get("/teams/:id/members", auth, async (req, res) => {
  const teamId = Number(req.params.id);
  const membership = await Team.getMembership({ teamId, userId: req.user.id });
  if (!membership) {
    return res.status(404).json({ message: "Team not found or inaccessible" });
  }

  const members = await Team.listMembers(teamId);
  return res.json(members);
});

router.post("/teams/:id/members", auth, async (req, res) => {
  const teamId = Number(req.params.id);
  const guard = await requireTeamAdmin(teamId, req.user.id);
  if (!guard.ok) {
    return res.status(guard.status).json({ message: guard.message });
  }

  const email = req.body?.email?.trim().toLowerCase();
  const role = req.body?.role || "engineer";
  if (!email) {
    return res.status(400).json({ message: "Invitee email is required" });
  }
  if (!allowedTeamRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid team role" });
  }

  const invitee = await User.findPublicByEmail(email);
  if (!invitee) {
    return res.status(404).json({ message: "User with that email was not found" });
  }

  const existing = await Team.getMembership({ teamId, userId: invitee._id });
  if (existing) {
    return res.status(409).json({ message: "User is already a member of this team" });
  }

  await Team.addMember({ teamId, userId: invitee._id, role, invitedBy: req.user.id });
  await AuditLog.create({
    userId: req.user.id,
    action: "team.member.add",
    entityType: "team",
    entityId: teamId,
    metadata: { inviteeEmail: email, role }
  });

  const members = await Team.listMembers(teamId);
  return res.status(201).json(members);
});

router.patch("/teams/:id/members/:userId", auth, async (req, res) => {
  const teamId = Number(req.params.id);
  const memberUserId = Number(req.params.userId);
  const role = req.body?.role;

  const guard = await requireTeamAdmin(teamId, req.user.id);
  if (!guard.ok) {
    return res.status(guard.status).json({ message: guard.message });
  }

  if (!allowedTeamRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid team role" });
  }

  const member = await Team.getMembership({ teamId, userId: memberUserId });
  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }

  await Team.updateMemberRole({ teamId, userId: memberUserId, role });
  await AuditLog.create({
    userId: req.user.id,
    action: "team.member.role.update",
    entityType: "team",
    entityId: teamId,
    metadata: { memberUserId, role }
  });

  const members = await Team.listMembers(teamId);
  return res.json(members);
});

router.delete("/teams/:id/members/:userId", auth, async (req, res) => {
  const teamId = Number(req.params.id);
  const memberUserId = Number(req.params.userId);

  const guard = await requireTeamAdmin(teamId, req.user.id);
  if (!guard.ok) {
    return res.status(guard.status).json({ message: guard.message });
  }

  if (memberUserId === Number(req.user.id)) {
    return res.status(400).json({ message: "Team admin cannot remove self" });
  }

  const removed = await Team.removeMember({ teamId, userId: memberUserId });
  if (!removed) {
    return res.status(404).json({ message: "Member not found" });
  }

  await AuditLog.create({
    userId: req.user.id,
    action: "team.member.remove",
    entityType: "team",
    entityId: teamId,
    metadata: { memberUserId }
  });

  const members = await Team.listMembers(teamId);
  return res.json(members);
});

module.exports = router;
