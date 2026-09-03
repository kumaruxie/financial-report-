import React, { useState, useEffect } from "react";
import { X, Lock, RefreshCw, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export default function OtpModal() {
  const { isOtpOpen, setIsOtpOpen, otpTarget, verifyOtp } = useAuth();
  const { addAuditLog } = useApp();

  const [inputTarget, setInputTarget] = useState(otpTarget || "");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("enter_target"); // 'enter_target' | 'enter_otp'
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (otpTarget) {
      setInputTarget(otpTarget);
      setStep("enter_otp");
      startTimer();
    }
  }, [otpTarget, isOtpOpen]);

  useEffect(() => {
    let interval = null;
    if (step === "enter_otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!inputTarget || inputTarget.trim().length < 5) {
      setErrorMsg("Please enter a valid email or 10-digit mobile number.");
      return;
    }
    setErrorMsg("");
    addAuditLog("OTP Request", inputTarget, "Success", "6-digit OTP generated and dispatched via SMS/Email");
    setStep("enter_otp");
    startTimer();
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next digit
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const codeStr = otpCode.join("");
    if (codeStr.length < 6 && codeStr !== "123456") {
      setErrorMsg("Please enter a complete 6-digit OTP code (e.g. 123456)");
      return;
    }
    setErrorMsg("");
    addAuditLog("User Auth", inputTarget, "Success", "OTP verified successfully. JWT session created.");
    verifyOtp(codeStr);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtpCode(["", "", "", "", "", ""]);
    setErrorMsg("New OTP sent to " + inputTarget);
    addAuditLog("OTP Request", inputTarget, "Success", "Resent OTP via SMS/Email");
    startTimer();
  };

  if (!isOtpOpen) return null;

  return (
    <div className="ff-modal-overlay">
      <div className="ff-modal-card">
        <div style={{ padding: "20px 24px", background: "var(--navy-900)", color: "#FFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={18} color="var(--gold-400)" />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Passwordless OTP Authentication</h3>
          </div>
          <button onClick={() => setIsOtpOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 28 }}>
          {step === "enter_target" ? (
            <form onSubmit={handleSendOtp}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--gold-100)", color: "var(--gold-500)", display: "flex", alignItems: "center", justifyCenter: "center", margin: "0 auto 12px" }}>
                  <ShieldCheck size={24} style={{ margin: "auto" }} />
                </div>
                <h4 style={{ fontSize: 18, color: "var(--navy-900)", marginBottom: 6 }}>Login to Finance Fitness</h4>
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Enter your email address or 10-digit mobile number to receive a one-time password.</p>
              </div>

              <div className="ff-form-group">
                <label>Email or Mobile Number</label>
                <input
                  type="text"
                  className="ff-input"
                  placeholder="Enter email or mobile number"
                  value={inputTarget}
                  onChange={(e) => setInputTarget(e.target.value)}
                  autoFocus
                />
              </div>

              {errorMsg && <div style={{ color: "var(--rose-600)", fontSize: 13, marginBottom: 16, background: "var(--rose-50)", padding: "8px 12px", borderRadius: 4 }}>{errorMsg}</div>}

              <button type="submit" className="ff-btn-cta" style={{ width: "100%", justifyContent: "center", padding: 12 }}>
                Send OTP Code <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h4 style={{ fontSize: 18, color: "var(--navy-900)", marginBottom: 6 }}>Verify OTP Code</h4>
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  Enter the 6-digit verification code sent to <strong style={{ color: "var(--navy-900)" }}>{inputTarget}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setStep("enter_target")}
                  style={{ background: "none", border: "none", color: "var(--gold-500)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
                >
                  Change Email / Mobile
                </button>
              </div>

              {/* 6 Digit Inputs */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    style={{
                      width: 44,
                      height: 52,
                      fontSize: 20,
                      textAlign: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      border: "2px solid var(--border-light)",
                      borderRadius: 8,
                      outline: "none"
                    }}
                  />
                ))}
              </div>

              {errorMsg && <div style={{ color: "var(--rose-600)", fontSize: 13, marginBottom: 16, textAlign: "center", background: "var(--rose-50)", padding: "8px 12px", borderRadius: 4 }}>{errorMsg}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't get code?"}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  style={{
                    background: "none",
                    border: "none",
                    color: canResend ? "var(--gold-500)" : "#94A3B8",
                    fontWeight: 600,
                    cursor: canResend ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </div>

              <button type="submit" className="ff-btn-cta" style={{ width: "100%", justifyContent: "center", padding: 12 }}>
                Verify & Login <CheckCircle2 size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
