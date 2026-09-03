import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { COUNTRY_CONFIGS, getCountryConfig } from "../../utils/countryData";

export default function AuthModal({ onSuccess }) {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    loginWithGoogle,
    loginWithEmail,
    sendDualOtp,
    verifyDualOtpRegister,
    loginWithMobileOtp,
    forgotPasswordReset
  } = useAuth();

  // Modes: 'signin' | 'signin_otp' | 'signup' | 'register_otp' | 'forgot_request' | 'forgot_otp'
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sign up mobile
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  // 6-digit OTP verification state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  // Clear all states and cache on modal open / mode switch
  const resetFormStates = (targetMode = "signin") => {
    setMode(targetMode);
    setErrorMsg("");
    setInfoMsg("");
    setOtpDigits(["", "", "", "", "", ""]);
    setTimer(60);
    setName("");
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPhoneNumber("");
    setShowPassword(false);
    setShowNewPassword(false);
  };

  useEffect(() => {
    if (isAuthModalOpen) {
      resetFormStates(authModalMode === "signup" ? "signup" : "signin");
    }
  }, [isAuthModalOpen, authModalMode]);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow || "unset";
      };
    }
  }, [isAuthModalOpen]);

  // Resend timer countdown
  useEffect(() => {
    let interval = null;
    if ((mode === "register_otp" || mode === "signin_otp" || mode === "forgot_otp") && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  if (!isAuthModalOpen) return null;

  // 1. Google 1-Click Sign-In
  const handleGoogleClick = async () => {
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess(res.user);
    } else {
      setErrorMsg(res.error);
    }
  };

  // 2. Mobile OTP Sign In — Step 1 Request OTP
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const countryCfg = getCountryConfig(phoneCountryCode);
    if (!cleanPhone || cleanPhone.length !== countryCfg.digits) {
      setErrorMsg(`Please enter a valid ${countryCfg.digits}-digit mobile number.`);
      return;
    }

    setLoading(true);
    const fullMobile = `${phoneCountryCode} ${cleanPhone}`;
    const res = await sendDualOtp({
      email: `${cleanPhone}@mobile.client`,
      mobile: fullMobile,
      name: "Client",
      type: "login_otp"
    });
    setLoading(false);

    if (res.success) {
      setMode("signin_otp");
      setTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setInfoMsg(`6-digit login code sent to ${fullMobile}`);
    } else {
      setErrorMsg(res.error || "Failed to send login code.");
    }
  };

  // 2B. Mobile OTP Sign In — Step 2 Verify OTP
  const handleSignInOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const codeStr = otpDigits.join("");
    if (codeStr.length < 6) {
      setErrorMsg("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const fullMobile = `${phoneCountryCode} ${cleanPhone}`;
    const res = await loginWithMobileOtp({
      mobile: fullMobile,
      email: `${cleanPhone}@mobile.client`,
      otp: codeStr
    });
    setLoading(false);

    if (res.success) {
      closeAuthModal();
      if (onSuccess) onSuccess(res.user);
    } else {
      setErrorMsg(res.error || "Invalid verification code. Please check your SMS.");
    }
  };

  // 3. Sign Up Submission -> Mobile OTP Verification (Passwordless!)
  const handleSignUpSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const countryCfg = getCountryConfig(phoneCountryCode);

    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!cleanPhone || cleanPhone.length !== countryCfg.digits) {
      setErrorMsg(`Please enter a valid ${countryCfg.digits}-digit mobile number.`);
      return;
    }

    // Set secure internal client password
    const clientPass = "Client@" + Math.floor(100000 + Math.random() * 900000);
    setPassword(clientPass);

    setLoading(true);
    const fullMobile = `${phoneCountryCode} ${cleanPhone}`;
    const res = await sendDualOtp({
      email: cleanEmail,
      mobile: fullMobile,
      name: cleanName,
      type: "register"
    });
    setLoading(false);

    if (res.success) {
      setMode("register_otp");
      setTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setInfoMsg(`6-digit security code sent to ${fullMobile}`);
    } else {
      setErrorMsg(res.error || "Failed to dispatch verification code.");
    }
  };

  // 4. Verify Dual OTP & Complete Registration
  const handleRegisterOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const codeStr = otpDigits.join("");
    if (codeStr.length < 6) {
      setErrorMsg("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    const fullMobile = phoneNumber ? `${phoneCountryCode} ${phoneNumber.replace(/\D/g, "")}` : "";
    const res = await verifyDualOtpRegister({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: fullMobile,
      password,
      otp: codeStr
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess(res.user);
    } else {
      setErrorMsg(res.error || "Invalid verification code. Please check your Email / SMS.");
    }
  };

  // 5. Forgot Password: Step 1 Request Code
  const handleForgotRequestSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const res = await sendDualOtp({
      email: cleanEmail,
      name: "",
      type: "forgot_password"
    });
    setLoading(false);

    if (res.success) {
      setMode("forgot_otp");
      setTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setInfoMsg(`Reset code sent to ${cleanEmail}`);
    } else {
      setErrorMsg(res.error || "No account found with this email.");
    }
  };

  // 6. Forgot Password: Step 2 Verify Code & Set New Password
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const codeStr = otpDigits.join("");
    if (codeStr.length < 6) {
      setErrorMsg("Please enter the 6-digit reset code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    const res = await forgotPasswordReset({
      email: email.trim().toLowerCase(),
      otp: codeStr,
      newPassword
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess && res.user) onSuccess(res.user);
    } else {
      setErrorMsg(res.error || "Failed to reset password.");
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`dual-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`dual-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtpDigits(newOtp);
      const nextIdx = Math.min(pasteData.length, 5);
      const targetInput = document.getElementById(`dual-otp-${nextIdx}`);
      if (targetInput) targetInput.focus();
    }
  };

  const activeCountry = getCountryConfig(phoneCountryCode);

  return (
    <div
      className="ff-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 5, 9, 0.88)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflow: "hidden"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="ff-auth-modal-card"
        style={{
          background: "linear-gradient(145deg, rgba(16, 21, 33, 0.98) 0%, rgba(9, 12, 19, 0.99) 100%)",
          border: "1px solid rgba(201, 154, 75, 0.28)",
          borderRadius: 20,
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(201, 154, 75, 0.12)",
          width: "100%",
          maxWidth: 390,
          overflow: "hidden",
          position: "relative",
          margin: "auto",
          boxSizing: "border-box",
          animation: "modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Subtle decorative gold ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201, 154, 75, 0.18) 0%, rgba(0, 0, 0, 0) 70%)",
            pointerEvents: "none"
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: "18px 22px 8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            position: "relative",
            zIndex: 1
          }}
        >
          <div>
            {mode !== "signin" && mode !== "signup" && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setInfoMsg("");
                  setMode(mode === "register_otp" ? "signup" : "signin");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-gold)",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  cursor: "pointer",
                  marginBottom: 4,
                  padding: 0,
                  fontWeight: 600
                }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <h3
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "var(--text-main)",
                margin: 0,
                fontFamily: "var(--font-serif)",
                letterSpacing: "-0.01em"
              }}
            >
              {mode === "signin" && "Sign In with Mobile OTP"}
              {mode === "signin_otp" && "Verify Mobile Number"}
              {mode === "signup" && "Create an Account"}
              {mode === "register_otp" && "Verify Mobile Number"}
              {mode === "forgot_request" && "Reset Password"}
              {mode === "forgot_otp" && "Set New Password"}
            </h3>

            <p style={{ fontSize: 12, color: "var(--text-fog)", margin: "2px 0 0", lineHeight: 1.35 }}>
              {mode === "signin" && "Enter your mobile number to receive an instant verification OTP"}
              {mode === "signin_otp" && `Enter the 6-digit code sent to ${phoneCountryCode} ${phoneNumber}`}
              {mode === "signup" && "Join to evaluate and track your wealth journey"}
              {mode === "register_otp" && `Enter the 6-digit code sent to ${phoneCountryCode} ${phoneNumber}`}
              {mode === "forgot_request" && "Enter your registered email to receive a reset code"}
              {mode === "forgot_otp" && "Enter the verification code & create your new password"}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="ff-btn-ghost"
            style={{
              padding: 4,
              borderRadius: 6,
              color: "var(--text-fog)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "6px 22px 18px", position: "relative", zIndex: 1 }}>
          {/* Alerts */}
          {errorMsg && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#F87171",
                padding: "11px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 8
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              style={{
                background: "rgba(95, 168, 160, 0.12)",
                border: "1px solid rgba(95, 168, 160, 0.35)",
                color: "var(--accent-teal)",
                padding: "11px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 8
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* ================= 1. SIGN IN VIEW ================= */}
          {mode === "signin" && (
            <>
              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "var(--text-main)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: 2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
                  e.currentTarget.style.borderColor = "var(--accent-gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "10px 0", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <span style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  or with mobile OTP
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>

              <form onSubmit={handleSignInSubmit}>
                <div className="ff-form-group" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontWeight: 500 }}>
                    <Phone size={13} color="var(--accent-gold)" /> Mobile Number
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      className="ff-input ff-auth-input"
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value);
                        setPhoneNumber("");
                      }}
                      style={{ width: "115px", flexShrink: 0, padding: "0 8px", fontSize: 12 }}
                    >
                      {COUNTRY_CONFIGS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className="ff-input ff-auth-input"
                      placeholder={activeCountry.placeholder || "10-digit mobile number"}
                      maxLength={activeCountry.digits + 2}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, activeCountry.digits))}
                      style={{ flex: 1, minWidth: 0 }}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ff-btn-primary"
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                    color: "#07080C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 4px 18px rgba(201, 154, 75, 0.25)"
                  }}
                >
                  {loading ? "Sending OTP..." : "Get Login OTP"} <ArrowRight size={15} />
                </button>

                <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--text-fog)" }}>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetFormStates("signup");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-gold)",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: 12
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ================= 2. SIGN UP VIEW ================= */}
          {mode === "signup" && (
            <>
              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "var(--text-main)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: 2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
                  e.currentTarget.style.borderColor = "var(--accent-gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", margin: "10px 0", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <span style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  or enter details
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>

              <form onSubmit={handleSignUpSubmit}>
                <div className="ff-form-group" style={{ marginBottom: 9 }}>
                  <label style={{ fontSize: 11.5, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 5, marginBottom: 3, fontWeight: 500 }}>
                    <User size={13} color="var(--accent-gold)" /> Full Name
                  </label>
                  <input
                    type="text"
                    className="ff-input ff-auth-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    autoFocus
                    required
                  />
                </div>

                <div className="ff-form-group" style={{ marginBottom: 9 }}>
                  <label style={{ fontSize: 11.5, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 5, marginBottom: 3, fontWeight: 500 }}>
                    <Mail size={13} color="var(--accent-gold)" /> Email Address
                  </label>
                  <input
                    type="email"
                    className="ff-input ff-auth-input"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="ff-form-group" style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 11.5, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 5, marginBottom: 3, fontWeight: 500 }}>
                    <Phone size={13} color="var(--accent-gold)" /> Mobile Number
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      className="ff-input ff-auth-input"
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value);
                        setPhoneNumber("");
                      }}
                      style={{ width: "115px", flexShrink: 0, padding: "0 8px", fontSize: 12 }}
                    >
                      {COUNTRY_CONFIGS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className="ff-input ff-auth-input"
                      placeholder={activeCountry.placeholder || "10-digit mobile number"}
                      maxLength={activeCountry.digits + 2}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, activeCountry.digits))}
                      style={{ flex: 1, minWidth: 0 }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ff-btn-primary"
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                    color: "#07080C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 4px 18px rgba(201, 154, 75, 0.25)"
                  }}
                >
                  {loading ? "Sending Code..." : "Send Verification Code"} <ArrowRight size={15} />
                </button>

                <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--text-fog)" }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetFormStates("signin");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-gold)",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: 12
                    }}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ================= 3. OTP VERIFICATION (SIGNUP & SIGNIN) ================= */}
          {(mode === "register_otp" || mode === "signin_otp") && (
            <form onSubmit={mode === "signin_otp" ? handleSignInOtpVerify : handleRegisterOtpVerify}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(201, 154, 75, 0.15)",
                    color: "var(--accent-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px"
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-soft)", margin: 0, lineHeight: 1.4 }}>
                  Enter 6-digit verification code sent to:<br />
                  <strong style={{ color: "var(--text-main)" }}>{phoneCountryCode} {phoneNumber}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin_otp" ? "signin" : "signup")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-gold)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 4
                  }}
                >
                  Change Mobile Number
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`dual-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: 38,
                      height: 42,
                      fontSize: 18,
                      textAlign: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: digit ? "1px solid var(--accent-gold)" : "1px solid var(--border-medium)",
                      borderRadius: 8,
                      color: "var(--text-main)",
                      outline: "none",
                      boxShadow: digit ? "0 0 10px rgba(201, 154, 75, 0.25)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  />
                ))}
              </div>

              {/* Resend Timer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontSize: 12 }}>
                <span style={{ color: "var(--text-fog)" }}>
                  {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code?"}
                </span>
                <button
                  type="button"
                  onClick={mode === "signin_otp" ? handleSignInSubmit : handleSignUpSubmit}
                  disabled={timer > 0}
                  style={{
                    background: "none",
                    border: "none",
                    color: timer === 0 ? "var(--accent-gold)" : "var(--text-fog)",
                    fontWeight: 600,
                    cursor: timer === 0 ? "pointer" : "not-allowed",
                    fontSize: 12
                  }}
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ff-btn-primary"
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                  color: "#07080C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 18px rgba(201, 154, 75, 0.25)"
                }}
              >
                {loading ? "Verifying..." : mode === "signin_otp" ? "Verify & Sign In" : "Verify & Complete Registration"} <CheckCircle2 size={15} />
              </button>
            </form>
          )}

          {/* ================= 4. FORGOT PASSWORD: STEP 1 (REQUEST CODE) ================= */}
          {mode === "forgot_request" && (
            <form onSubmit={handleForgotRequestSubmit}>
              <div className="ff-form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontWeight: 500 }}>
                  <Mail size={14} color="var(--accent-gold)" /> Registered Email Address
                </label>
                <input
                  type="email"
                  className="ff-input"
                  placeholder="Enter your registered email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ff-btn-primary"
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                  color: "#07080C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 25px rgba(201, 154, 75, 0.3)"
                }}
              >
                {loading ? "Sending Reset Code..." : "Send Reset Code"} <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text-fog)" }}>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => resetFormStates("signin")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-gold)",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= 5. FORGOT PASSWORD: STEP 2 (VERIFY CODE & NEW PASSWORD) ================= */}
          {mode === "forgot_otp" && (
            <form onSubmit={handleForgotResetSubmit}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: 0 }}>
                  Enter the 6-digit reset code sent to<br />
                  <strong style={{ color: "var(--text-main)" }}>{email}</strong>
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`dual-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: 44,
                      height: 50,
                      fontSize: 22,
                      textAlign: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: digit ? "1px solid var(--accent-gold)" : "1px solid var(--border-medium)",
                      borderRadius: 10,
                      color: "var(--text-main)",
                      outline: "none",
                      boxShadow: digit ? "0 0 12px rgba(201, 154, 75, 0.25)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  />
                ))}
              </div>

              <div className="ff-form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontWeight: 500 }}>
                  <Lock size={14} color="var(--accent-gold)" /> New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="ff-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: 42 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-fog)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="ff-form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontWeight: 500 }}>
                  <Lock size={14} color="var(--accent-gold)" /> Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="ff-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ff-btn-primary"
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                  color: "#07080C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 25px rgba(201, 154, 75, 0.3)"
                }}
              >
                {loading ? "Updating..." : "Reset Password & Sign In"} <CheckCircle2 size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
