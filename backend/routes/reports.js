const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Enquiry = require("../models/Enquiry");
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

    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      try {
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
      } catch (dbErr) {
        console.error("MongoDB Save Error (continuing in fallback mode):", dbErr.message);
      }
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/reports/enquiry — save contact/advisory enquiry
router.post("/enquiry", async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;
    let enqObj = {
      _id: "enq_" + Date.now(),
      name: name || "Advisory Client",
      email: email || "",
      topic: topic || "General Enquiry",
      message: message || "",
      createdAt: new Date().toISOString()
    };

    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      try {
        const created = await Enquiry.create({
          name: name || "Advisory Client",
          email: email || "",
          topic: topic || "General Enquiry",
          message: message || ""
        });
        enqObj = { ...created.toObject(), _id: created._id, id: created._id };

        await AuditLog.create({
          type: "Advisory Enquiry",
          user: email || name || "Anonymous",
          status: "Success",
          details: `Contact enquiry: ${topic || "General"}`
        }).catch(() => {});
      } catch (dbErr) {
        console.error("MongoDB Enquiry Save Error:", dbErr.message);
      }
    }

    res.json({ success: true, enquiry: enqObj });
  } catch (err) {
    console.error("Enquiry submission error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

