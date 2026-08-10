const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// POST /api/v1/reports/submit — save form submission
router.post("/submit", async (req, res) => {
  try {
    const data = req.body;
    let leadObj = {
      _id: "lead_" + Date.now(),
      name:            data.name || "Client User",
      email:           data.email || "",
      mobile:          data.mobile || "",
      age:             String(data.age || ""),
      income:          String(data.income || "0"),
      expenses:        String(data.expenses || "0"),
      savings:         String(data.savings || "0"),
      city:            data.city || "",
      retirementAge:   String(data.retirementAge || "60"),
      termInsurance:   data.termInsurance || "no",
      termAmount:      String(data.termAmount || "0"),
      healthInsurance: data.healthInsurance || "no",
      healthAmount:    String(data.healthAmount || "0"),
      goals:           Array.isArray(data.goals) ? data.goals : [],
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      const created = await Lead.create({
        name:            data.name || "Client User",
        email:           data.email || "",
        mobile:          data.mobile || "",
        age:             String(data.age || ""),
        income:          String(data.income || "0"),
        expenses:        String(data.expenses || "0"),
        savings:         String(data.savings || "0"),
        city:            data.city || "",
        retirementAge:   String(data.retirementAge || "60"),
        termInsurance:   data.termInsurance || "no",
        termAmount:      String(data.termAmount || "0"),
        healthInsurance: data.healthInsurance || "no",
        healthAmount:    String(data.healthAmount || "0"),
        goals:           Array.isArray(data.goals) ? data.goals : [],
      });
      leadObj = { ...created.toObject(), _id: created._id, id: created._id };

      await AuditLog.create({
        type: "Lead Submission",
        user: data.email || data.mobile || "Anonymous",
        status: "Success",
        details: `New lead submitted: ${data.name || "Client User"}`
      }).catch(() => {});
    }

    res.json({
      success: true,
      report: {
        ...leadObj,
        id: leadObj._id || leadObj.id,
        submittedAt: leadObj.createdAt || new Date().toISOString(),
      },
      pdfUrl: null
    });
  } catch (err) {
    console.error("Submit error:", err);

    if (mongoose.connection.readyState === 1) {
      await AuditLog.create({
        type: "Lead Submission",
        user: req.body?.email || "Anonymous",
        status: "Error",
        details: err.message
      }).catch(() => {});
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

