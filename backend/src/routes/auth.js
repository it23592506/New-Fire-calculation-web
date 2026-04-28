const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findByEmail(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role =
    process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase().trim()
      ? "admin"
      : "user";
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    role
  });

  return res.status(201).json({ message: "Registered successfully", userId: user._id });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findByEmail(email.toLowerCase().trim());
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const token = jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

module.exports = router;
