const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// POST /api/v1/admin/verify-pass — verify admin password
router.post("/verify-pass", (req, res) => {
  const { password } = req.body;
  if (password === "work2026@") {
    res.json({ success: true, message: "Access granted" });
  } else {
    res.status(401).json({ success: false, error: "Invalid admin password" });
  }
});

// GET /api/v1/admin/leads — fetch all real leads for admin CRM
router.get("/leads", async (req, res) => {
  try {
    let leads = [];
    if (mongoose.connection.readyState === 1) {
      leads = await Lead.find().sort({ createdAt: -1 }).lean();
    }

    // Map to match the frontend's expected shape
    const mapped = leads.map((l) => ({
      id: l._id,
      name: l.name,
      email: l.email,
      mobile: l.mobile,
      age: l.age,
      income: l.income,
      expenses: l.expenses,
      savings: l.savings,
      city: l.city,
      retirementAge: l.retirementAge,
      termInsurance: l.termInsurance,
      termAmount: l.termAmount,
      healthInsurance: l.healthInsurance,
      healthAmount: l.healthAmount,
      goals: l.goals || [],
      pdfUrl: l.pdfUrl || null,
      submittedAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    res.json({ success: true, leads: mapped });
  } catch (err) {
    console.error("Get leads error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/admin/leads/:id — delete a lead
router.delete("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      await Lead.findByIdAndDelete(id);
    }
    await AuditLog.create({
      type: "Lead Management",
      user: "Admin",
      status: "Success",
      details: `Lead deleted: ${id}`
    }).catch(() => {});

    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    console.error("Delete lead error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/logs — fetch all audit logs
router.get("/logs", async (req, res) => {
  try {
    let logs = [];
    if (mongoose.connection.readyState === 1) {
      logs = await AuditLog.find().sort({ createdAt: -1 }).lean();
    }

    const mapped = logs.map((l) => ({
      id: l._id,
      timestamp: l.createdAt,
      type: l.type,
      user: l.user,
      status: l.status,
      details: l.details,
    }));

    res.json({ success: true, logs: mapped });
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

