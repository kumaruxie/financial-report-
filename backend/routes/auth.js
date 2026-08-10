const express = require("express");
const router = express.Router();

// POST /api/v1/auth/request-otp — stub (no real OTP for now)
router.post("/request-otp", (req, res) => {
  res.json({ success: true, message: "OTP sent (stub)" });
});

// POST /api/v1/auth/verify-otp — stub (auto-approve)
router.post("/verify-otp", (req, res) => {
  const { identifier, name } = req.body;
  res.json({
    success: true,
    token: "jwt_" + Date.now(),
    user: {
      id: "usr_" + Date.now(),
      name: name || "Client User",
      email: identifier && identifier.includes("@") ? identifier : "",
      role: "client"
    }
  });
});

module.exports = router;
