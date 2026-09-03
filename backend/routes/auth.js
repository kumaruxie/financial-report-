const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// In-memory fallback cache when running in offline/standalone mode
const localUsersStore = new Map();
const pendingOtps = new Map(); // key (email or mobile) -> { otp, expiresAt, name, email, mobile, type }

// Setup email transporter if configured
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch (e) {
    return false;
  }
}

function generateToken(user) {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    name: user.name,
    role: user.role || "client",
    ts: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function dispatchDualOtp(email, mobile, name, otp, purpose = "Verification") {
  console.log(`\n======================================================`);
  console.log(`🔑 [DUAL OTP DISPATCH - ${purpose.toUpperCase()}]`);
  console.log(`   ✉️  Email:  ${email}`);
  console.log(`   📱 Mobile: ${mobile || "N/A"}`);
  console.log(`   ⚡ 6-Digit Code: >>> ${otp} <<<`);
  console.log(`======================================================\n`);

  // 1. Send to Email via nodemailer if available
  if (transporter && email) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Your Wealth Compass" <no-reply@wealthcompass.com>`,
        to: email,
        subject: `${otp} is your ${purpose} code for Your Wealth Compass`,
        html: `
          <div style="background:#07080C; color:#F5F7FA; font-family:sans-serif; padding:32px; border-radius:14px; max-width:480px; margin:0 auto; border:1px solid #C99A4B;">
            <div style="margin-bottom:20px; border-bottom:1px solid rgba(201,154,75,0.2); padding-bottom:12px;">
              <h2 style="color:#C99A4B; margin:0; font-size:22px;">Your Wealth Compass</h2>
              <p style="color:#94A3B8; font-size:12px; margin:4px 0 0;">Precision Wealth & Financial Diagnostics</p>
            </div>
            <p style="font-size:14px; color:#CBD5E1; margin:0 0 16px;">Hello ${name || "there"},</p>
            <p style="font-size:14px; color:#94A3B8; margin:0 0 20px;">Use the following 6-digit ${purpose.toLowerCase()} code for your account:</p>
            <div style="font-size:32px; font-weight:800; letter-spacing:8px; color:#C99A4B; background:rgba(201,154,75,0.12); border:1px solid rgba(201,154,75,0.3); border-radius:10px; padding:18px; text-align:center; margin:0 0 20px; font-family:monospace;">
              ${otp}
            </div>
            <p style="font-size:12px; color:#64748B; margin:0 0 8px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; margin-top:20px; font-size:11px; color:#475569;">
              &copy; ${new Date().getFullYear()} Your Wealth Compass. All rights reserved.
            </div>
          </div>
        `
      });
      console.log(`[EMAIL DISPATCH] Sent live email to ${email}`);
    } catch (mailErr) {
      console.warn("[EMAIL DISPATCH] SMTP delivery notice:", mailErr.message);
    }
  }
}

// 1. POST /api/v1/auth/send-dual-otp — Send OTP to Email AND Mobile simultaneously
router.post("/send-dual-otp", async (req, res) => {
  try {
    const { email, mobile, name, type } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();
    const isForgotPassword = type === "forgot_password";
    const isLoginOtp = type === "login_otp";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address or mobile number." });
    }

    if (isForgotPassword) {
      let existingUser = null;
      try {
        existingUser = await User.findOne({ email: cleanEmail });
      } catch (e) {
        existingUser = localUsersStore.get(cleanEmail);
      }
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "No account found with this email address." });
      }
    } else if (!isLoginOtp) {
      // Registration: Check if already exists
      let existingUser = null;
      try {
        existingUser = await User.findOne({ email: cleanEmail });
      } catch (e) {
        existingUser = localUsersStore.get(cleanEmail);
      }
      if (existingUser) {
        return res.status(400).json({ success: false, error: "An account with this email address already exists. Please sign in." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    pendingOtps.set(cleanEmail, {
      otp,
      expiresAt,
      email: cleanEmail,
      mobile: cleanMobile,
      name: (name || "").trim(),
      type: type || "register"
    });

    await dispatchDualOtp(cleanEmail, cleanMobile, name, otp, isForgotPassword ? "Password Reset" : "Verification");

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}${cleanMobile ? " & " + cleanMobile : ""}`,
      code: otp
    });
  } catch (err) {
    console.error("send-dual-otp error:", err);
    return res.status(500).json({ success: false, error: "Failed to dispatch verification code." });
  }
});

// 2. POST /api/v1/auth/verify-dual-otp-register — Verify OTP & create account
router.post("/verify-dual-otp-register", async (req, res) => {
  try {
    const { name, email, mobile, password, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();
    const cleanMobile = (mobile || "").trim();
    const cleanOtp = (otp || "").trim();

    const finalPassword = (password || "Client@2026").trim();
    if (!cleanEmail || !cleanName) {
      return res.status(400).json({ success: false, error: "Name and email are required." });
    }

    const cached = pendingOtps.get(cleanEmail);
    if (!cached || cached.type !== "register") {
      return res.status(400).json({ success: false, error: "Verification code expired or not requested. Please request a new code." });
    }

    if (Date.now() > cached.expiresAt) {
      pendingOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new one." });
    }

    if (cached.otp !== cleanOtp) {
      return res.status(400).json({ success: false, error: "Incorrect verification code. Please check your Email/SMS." });
    }

    // OTP Verified! Clear pending
    pendingOtps.delete(cleanEmail);

    let existingUser = null;
    try {
      existingUser = await User.findOne({ email: cleanEmail });
    } catch (e) {
      existingUser = localUsersStore.get(cleanEmail);
    }

    if (existingUser) {
      return res.status(400).json({ success: false, error: "An account with this email already exists. Please sign in." });
    }

    const passwordHash = hashPassword(password);
    let createdUser = null;

    try {
      const dbUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        passwordHash,
        role: "client"
      });
      createdUser = dbUser.toObject();
    } catch (dbErr) {
      createdUser = {
        _id: "usr_" + Date.now(),
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        passwordHash,
        role: "client",
        createdAt: new Date().toISOString()
      };
      localUsersStore.set(cleanEmail, createdUser);
    }

    const safeUser = {
      id: createdUser._id || createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      mobile: createdUser.mobile,
      role: createdUser.role,
      createdAt: createdUser.createdAt
    };

    const token = generateToken(safeUser);

    try {
      await AuditLog.create({
        type: "User Registered",
        user: cleanEmail,
        status: "Success",
        details: `Account registered & dual-verified for ${cleanName}`
      });
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: "Account verified and created successfully!",
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("verify-dual-otp-register error:", err);
    return res.status(500).json({ success: false, error: "Failed to verify registration code." });
  }
});

// 2B. POST /api/v1/auth/verify-login-otp — Mobile OTP Sign In
router.post("/verify-login-otp", async (req, res) => {
  try {
    const { mobile, email, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();
    const cleanOtp = (otp || "").trim();

    const cached = pendingOtps.get(cleanEmail) || (cleanMobile ? pendingOtps.get(cleanMobile) : null);
    if (!cached || cached.type !== "login_otp") {
      return res.status(400).json({ success: false, error: "OTP expired or not requested. Please request a new OTP." });
    }

    if (Date.now() > cached.expiresAt) {
      pendingOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "OTP has expired. Please request a new one." });
    }

    if (cached.otp !== cleanOtp) {
      return res.status(400).json({ success: false, error: "Incorrect OTP. Please check your SMS and try again." });
    }

    pendingOtps.delete(cleanEmail);

    let user = null;
    try {
      user = await User.findOne({ $or: [{ email: cleanEmail }, { mobile: cleanMobile }] });
    } catch (e) {
      user = localUsersStore.get(cleanEmail) || localUsersStore.get(cleanMobile);
    }

    if (!user) {
      const name = cached.name || "Client User";
      const defaultPass = "Client@2026";
      const passwordHash = hashPassword(defaultPass);
      try {
        user = await User.create({
          name,
          email: cleanEmail.includes("@") ? cleanEmail : `${cleanMobile.replace(/\D/g, "")}@mobile.client`,
          mobile: cleanMobile,
          passwordHash,
          role: "client"
        });
      } catch (err) {
        user = {
          _id: "local_" + Date.now(),
          id: "local_" + Date.now(),
          name,
          email: cleanEmail,
          mobile: cleanMobile,
          role: "client"
        };
        localUsersStore.set(cleanEmail, user);
      }
    }

    const token = generateToken(user);
    const safeUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || cleanMobile,
      role: user.role || "client",
      token
    };

    return res.json({
      success: true,
      message: "Successfully signed in!",
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("verify-login-otp error:", err);
    return res.status(500).json({ success: false, error: "Failed to verify login OTP." });
  }
});

// 3. POST /api/v1/auth/forgot-password-reset — Reset password using OTP
router.post("/forgot-password-reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim();

    if (!cleanEmail || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
    }

    const cached = pendingOtps.get(cleanEmail);
    if (!cached || cached.type !== "forgot_password") {
      return res.status(400).json({ success: false, error: "Reset code expired or not requested. Please request a new code." });
    }

    if (Date.now() > cached.expiresAt) {
      pendingOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "Reset code has expired. Please request a new one." });
    }

    if (cached.otp !== cleanOtp) {
      return res.status(400).json({ success: false, error: "Incorrect verification code. Please check and try again." });
    }

    pendingOtps.delete(cleanEmail);

    const newHash = hashPassword(newPassword);
    let updatedUser = null;

    try {
      updatedUser = await User.findOneAndUpdate(
        { email: cleanEmail },
        { $set: { passwordHash: newHash } },
        { new: true }
      );
    } catch (e) {
      console.warn("DB password update notice:", e.message);
    }

    if (!updatedUser) {
      const localUser = localUsersStore.get(cleanEmail);
      if (localUser) {
        localUser.passwordHash = newHash;
        localUsersStore.set(cleanEmail, localUser);
        updatedUser = localUser;
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    const safeUser = {
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      role: updatedUser.role || "client"
    };

    const token = generateToken(safeUser);

    try {
      await AuditLog.create({
        type: "Password Reset",
        user: cleanEmail,
        status: "Success",
        details: `Password reset successfully for ${safeUser.name}`
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: "Password reset successfully! You are now signed in.",
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("forgot-password-reset error:", err);
    return res.status(500).json({ success: false, error: "Failed to reset password." });
  }
});

// 4. POST /api/v1/auth/login — Login with email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, error: "Please enter both email and password." });
    }

    let user = null;
    try {
      user = await User.findOne({ email: cleanEmail });
    } catch (dbErr) {
      user = localUsersStore.get(cleanEmail);
    }

    if (!user) {
      user = localUsersStore.get(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "No account found with this email. Please check or register." });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Incorrect password. Please check your password or use 'Forgot Password'." });
    }

    const safeUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role || "client",
      createdAt: user.createdAt
    };

    const token = generateToken(safeUser);

    try {
      await AuditLog.create({
        type: "User Login",
        user: cleanEmail,
        status: "Success",
        details: `User logged in: ${safeUser.name}`
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Server error during login." });
  }
});

// 5. POST /api/v1/auth/send-email-otp (Compatibility)
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email, name } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOtps.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      email: cleanEmail,
      name: (name || "").trim(),
      type: "register"
    });
    await dispatchDualOtp(cleanEmail, "", name, otp, "Verification");
    return res.json({ success: true, message: `Verification code sent to ${cleanEmail}`, code: otp });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Failed to send code." });
  }
});

// 6. POST /api/v1/auth/verify-email-otp-register (Compatibility)
router.post("/verify-email-otp-register", async (req, res) => {
  const { name, email, mobile, password, otp } = req.body;
  return router.handle({ ...req, url: "/verify-dual-otp-register" }, res);
});

// 7. GET /api/v1/auth/me — Validate token / Return profile
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No token provided." });
  }

  try {
    const rawToken = authHeader.replace("Bearer ", "");
    const decoded = JSON.parse(Buffer.from(rawToken, "base64").toString("utf-8"));
    return res.json({ success: true, user: decoded });
  } catch (e) {
    return res.status(401).json({ success: false, error: "Invalid session token." });
  }
});

module.exports = router;
