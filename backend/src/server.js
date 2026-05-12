require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const teamRoutes = require("./routes/teams");
const complianceRoutes = require("./routes/compliance");
const copilotRoutes = require("./routes/copilot");
const auditRoutes = require("./routes/audit");
const analyticsRoutes = require("./routes/analytics");
const integrationsRoutes = require("./routes/integrations");
const badgesRoutes = require("./routes/badges");
const fireQaRoutes = require("./routes/fireQa");
const extinguishersRoutes = require("./routes/extinguishers");
const engineeringRoutes = require("./routes/engineering");

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running successfully" });
});

app.get("/test", (_req, res) => {
  res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() });
});

app.use("/api", authRoutes);
app.use("/api", reportRoutes);
app.use("/api", adminRoutes);
app.use("/api", teamRoutes);
app.use("/api", complianceRoutes);
app.use("/api", copilotRoutes);
app.use("/api", auditRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", integrationsRoutes);
app.use("/api", badgesRoutes);
app.use("/api", fireQaRoutes);
app.use("/api", extinguishersRoutes);
app.use("/api", engineeringRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
