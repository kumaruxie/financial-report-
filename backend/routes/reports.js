const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Enquiry = require("../models/Enquiry");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// Helper to extract user info from Authorization token (supports both base64 JSON & Firebase JWTs)
function getUserFromAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const raw = authHeader.replace("Bearer ", "").trim();
    const parts = raw.split(".");
    if (parts.length === 3) {
      const payload = parts[1];
      const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
      return {
        id: decoded.user_id || decoded.sub || decoded.uid || decoded.id,
        email: decoded.email || "",
        name: decoded.name || "",
        role: decoded.role || "client"
      };
    }
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch (e) {
    return null;
  }
}

// POST /api/v1/reports/submit — save form submission
router.post("/submit", async (req, res) => {
  try {
    const data = req.body;
    const authUser = getUserFromAuth(req);
    const resolvedUserId = data.userId || (authUser ? authUser.id : "");

    const termIns = data.termInsurance || (data.protection?.termInsurance ? "yes" : "no");
    const termAmt = String(data.termAmount || data.protection?.termAmount || "0");
    const healthIns = data.healthInsurance || (data.protection?.healthInsurance ? "yes" : "no");
    const healthAmt = String(data.healthAmount || data.protection?.healthAmount || "0");
    const cityVal = data.city || data.protection?.city || "";
    const retAgeVal = String(data.retirementAge || data.protection?.retirementAge || "60");

    let leadObj = {
      _id: "lead_" + Date.now(),
      userId:          resolvedUserId,
      name:            data.name || "Client User",
      email:           data.email || "",
      mobile:          data.mobile || "",
      age:             String(data.age || ""),
      income:          String(data.income || "0"),
      expenses:        String(data.expenses || "0"),
      savings:         String(data.savings || "0"),
      city:            cityVal,
      retirementAge:   retAgeVal,
      termInsurance:   termIns,
      termAmount:      termAmt,
      healthInsurance: healthIns,
      healthAmount:    healthAmt,
      goals:           Array.isArray(data.goals) ? data.goals : [],
      healthScore:     Number(data.healthScore) || (data.scores?.overallScore) || 0,
      totalMonthlyRequired: Number(data.totalMonthlyRequired) || 0,
      emergencyGap:    Number(data.emergencyGap) || 0,
      scores:          data.scores || {},
      protection:      data.protection || {
        termInsurance: termIns === "yes",
        termAmount: termAmt,
        healthInsurance: healthIns === "yes",
        healthAmount: healthAmt,
        city: cityVal,
        retirementAge: retAgeVal
      },
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    // Auto-assignment logic (Round-robin / least-loaded active advisor)
    let assignedData = { advisorId: null, advisorName: "", advisorEmail: "", assignedAt: null };
    try {
      const activeAdvisors = await User.find({ role: "advisor", status: "active" }).lean();
      if (activeAdvisors && activeAdvisors.length > 0) {
        const advisorsWithCounts = await Promise.all(
          activeAdvisors.map(async (adv) => {
            const count = await Lead.countDocuments({ "assignedTo.advisorId": adv._id.toString() });
            return { advisor: adv, count };
          })
        );
        advisorsWithCounts.sort((a, b) => a.count - b.count);
        const chosen = advisorsWithCounts[0].advisor;
        assignedData = {
          advisorId: chosen._id.toString(),
          advisorName: chosen.name,
          advisorEmail: chosen.email,
          assignedAt: new Date()
        };
      }
    } catch (assignErr) {
      console.warn("Auto-assignment logic skipped:", assignErr.message);
    }

    try {
      const created = await Lead.create({
        userId:          resolvedUserId,
        name:            data.name || "Client User",
        email:           data.email || "",
        mobile:          data.mobile || "",
        age:             String(data.age || ""),
        income:          String(data.income || "0"),
        expenses:        String(data.expenses || "0"),
        savings:         String(data.savings || "0"),
        city:            cityVal,
        retirementAge:   retAgeVal,
        termInsurance:   termIns,
        termAmount:      termAmt,
        healthInsurance: healthIns,
        healthAmount:    healthAmt,
        goals:           Array.isArray(data.goals) ? data.goals : [],
        healthScore:     leadObj.healthScore,
        totalMonthlyRequired: leadObj.totalMonthlyRequired,
        emergencyGap:    leadObj.emergencyGap,
        scores:          leadObj.scores,
        protection:      leadObj.protection,
        assignedTo:      assignedData,
        leadStatus:      "new",
        advisorNotes:    []
      });
      leadObj = { ...created.toObject(), _id: created._id, id: created._id };

      await AuditLog.create({
        type: "Lead Submission",
        user: data.email || data.mobile || (authUser ? authUser.email : "Anonymous"),
        status: "Success",
        details: `Assessment submitted: ${data.name || "Client User"} (Score: ${leadObj.healthScore}/100)${assignedData.advisorName ? ` [Auto-assigned to ${assignedData.advisorName}]` : " [Unassigned]"}`
      }).catch(() => {});
    } catch (dbErr) {
      console.error("MongoDB Save Error:", dbErr.message);
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

// GET /api/v1/reports/my-assessments — fetch all assessments for a user
router.get("/my-assessments", async (req, res) => {
  try {
    const authUser = getUserFromAuth(req);
    const { userId, email, mobile } = req.query;

    const targetUserId = userId || (authUser ? authUser.id : "");
    const targetEmail = (email || (authUser ? authUser.email : "")).trim().toLowerCase();
    const targetMobile = (mobile || (authUser ? authUser.mobile : "")).trim();

    const filters = [];
    if (targetUserId) filters.push({ userId: targetUserId });
    if (targetEmail && !targetEmail.endsWith("@mobile.client") && !targetEmail.includes("mobile.client")) {
      filters.push({ email: new RegExp("^" + targetEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") });
    }

    const cleanPhoneDigits = targetMobile ? targetMobile.replace(/\D/g, "") : "";
    const last10 = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;
    if (last10 && last10.length >= 7) {
      filters.push({ mobile: new RegExp(last10) });
    }

    if (filters.length === 0) {
      return res.json({ success: true, assessments: [] });
    }

    let records = [];
    try {
      records = await Lead.find({ $or: filters }).sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      console.error("Fetch user assessments error:", dbErr.message);
    }

    const mapped = records.map((l) => ({
      id: l._id,
      userId: l.userId || "",
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
      healthScore: l.healthScore || (l.scores?.overallScore) || 0,
      totalMonthlyRequired: l.totalMonthlyRequired || 0,
      emergencyGap: l.emergencyGap || 0,
      scores: l.scores || {},
      protection: l.protection || {
        termInsurance: l.termInsurance === "yes",
        termAmount: l.termAmount || "0",
        healthInsurance: l.healthInsurance === "yes",
        healthAmount: l.healthAmount || "0",
        city: l.city || "",
        retirementAge: l.retirementAge || "60"
      },
      pdfUrl: l.pdfUrl || null,
      submittedAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    res.json({ success: true, assessments: mapped });
  } catch (err) {
    console.error("Get my-assessments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/reports/:id — fetch single assessment
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let record = null;
    try {
      record = await Lead.findById(id).lean();
    } catch (e) {}

    if (!record) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }

    res.json({
      success: true,
      assessment: {
        ...record,
        id: record._id,
        submittedAt: record.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/reports/:id — delete assessment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Lead.findByIdAndDelete(id);
    } catch (e) {}
    res.json({ success: true, message: "Assessment deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/reports/enquiry — save contact/advisory enquiry
router.post("/enquiry", async (req, res) => {
  try {
    const { name, email, mobile, topic, message } = req.body;
    let enqObj = {
      _id: "enq_" + Date.now(),
      name: name || "Advisory Client",
      email: email || "",
      mobile: mobile || "",
      topic: topic || "General Wealth Advisory",
      message: message || "",
      createdAt: new Date().toISOString()
    };

    try {
      const created = await Enquiry.create({
        name: name || "Advisory Client",
        email: email || "",
        mobile: mobile || "",
        topic: topic || "General Wealth Advisory",
        message: message || ""
      });
      enqObj = { ...created.toObject(), _id: created._id, id: created._id };

      await AuditLog.create({
        type: "Advisory Enquiry",
        user: email || mobile || name || "Anonymous",
        status: "Success",
        details: `Contact enquiry from ${name || "Client"}: ${topic || "Advisory"} (Mobile: ${mobile || "N/A"})`
      }).catch(() => {});
    } catch (dbErr) {
      console.error("MongoDB Enquiry Save Error:", dbErr.message);
    }

    res.json({ success: true, enquiry: enqObj });
  } catch (err) {
    console.error("Enquiry submission error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
