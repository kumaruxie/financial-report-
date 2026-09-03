import React from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function StepProtection({ data, onChange, onNext }) {
  const formatRupeeInput = (rawVal) => {
    if (!rawVal || rawVal === "0") return "";
    const cleanNum = String(rawVal).replace(/[^0-9]/g, "");
    if (!cleanNum) return "";
    return "₹" + Number(cleanNum).toLocaleString("en-IN");
  };

  const handleCurrencyChange = (field, rawInputText) => {
    const cleanNumStr = rawInputText.replace(/[^0-9]/g, "");
    onChange(field, cleanNumStr);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onNext) {
      e.preventDefault();
      onNext();
    }
  };

  const isTermYes = data.termInsurance === "yes";
  const isTermNo = data.termInsurance === "no";

  const isHealthYes = data.healthInsurance === "yes";
  const isHealthNo = data.healthInsurance === "no";

  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: 0 }}>
          Insurance & Protection
        </h2>
      </div>

      {/* Term Life Insurance Selector */}
      <div className="ff-input-group" style={{ marginBottom: 28 }}>
        <label className="ff-input-label-uppercase">Do you have Term Life Insurance?</label>
        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          <button
            type="button"
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: isTermYes ? "2px solid var(--accent-gold)" : "1px solid rgba(255, 255, 255, 0.12)",
              background: isTermYes ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.03)",
              color: isTermYes ? "#07080C" : "var(--text-fog)",
              fontWeight: isTermYes ? 700 : 500,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: isTermYes ? "0 4px 20px rgba(201, 154, 75, 0.35)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              onChange("termInsurance", "yes");
            }}
          >
            {isTermYes && <CheckCircle2 size={16} />}
            Yes, Active Cover
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: isTermNo ? "1.5px solid rgba(217, 119, 87, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
              background: isTermNo ? "rgba(217, 119, 87, 0.12)" : "rgba(255, 255, 255, 0.03)",
              color: isTermNo ? "#F87171" : "var(--text-fog)",
              fontWeight: isTermNo ? 600 : 500,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              onChange("termInsurance", "no");
              onChange("termAmount", "0");
            }}
          >
            {isTermNo && <ShieldAlert size={16} color="#F87171" />}
            No Active Cover
          </button>
        </div>

        {isTermYes && (
          <div style={{ marginTop: 14 }}>
            <label className="ff-input-label-uppercase" style={{ fontSize: 11, color: "var(--accent-gold)", marginBottom: 6, display: "block" }}>
              Existing Term Cover Amount (₹)
            </label>
            <input
              type="text"
              autoComplete="off"
              className="ff-input-56px"
              placeholder="Enter existing term cover amount (₹)"
              value={formatRupeeInput(data.termAmount)}
              onChange={(e) => handleCurrencyChange("termAmount", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>

      {/* Health Insurance Selector */}
      <div className="ff-input-group" style={{ marginBottom: 28 }}>
        <label className="ff-input-label-uppercase">Do you have Health Insurance?</label>
        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          <button
            type="button"
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: isHealthYes ? "2px solid var(--accent-gold)" : "1px solid rgba(255, 255, 255, 0.12)",
              background: isHealthYes ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.03)",
              color: isHealthYes ? "#07080C" : "var(--text-fog)",
              fontWeight: isHealthYes ? 700 : 500,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: isHealthYes ? "0 4px 20px rgba(201, 154, 75, 0.35)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              onChange("healthInsurance", "yes");
            }}
          >
            {isHealthYes && <CheckCircle2 size={16} />}
            Yes, Active Cover
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: isHealthNo ? "1.5px solid rgba(217, 119, 87, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
              background: isHealthNo ? "rgba(217, 119, 87, 0.12)" : "rgba(255, 255, 255, 0.03)",
              color: isHealthNo ? "#F87171" : "var(--text-fog)",
              fontWeight: isHealthNo ? 600 : 500,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              onChange("healthInsurance", "no");
              onChange("healthAmount", "0");
            }}
          >
            {isHealthNo && <ShieldAlert size={16} color="#F87171" />}
            No Active Cover
          </button>
        </div>

        {isHealthYes && (
          <div style={{ marginTop: 14 }}>
            <label className="ff-input-label-uppercase" style={{ fontSize: 11, color: "var(--accent-gold)", marginBottom: 6, display: "block" }}>
              Existing Health Cover Amount (₹)
            </label>
            <input
              type="text"
              autoComplete="off"
              className="ff-input-56px"
              placeholder="Enter existing health cover amount (₹)"
              value={formatRupeeInput(data.healthAmount)}
              onChange={(e) => handleCurrencyChange("healthAmount", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>

      <div className="ff-input-group" style={{ marginBottom: 20 }}>
        <label className="ff-input-label-uppercase">Your City</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter your city name"
          value={data.city || ""}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </div>

      <div className="ff-input-group" style={{ marginBottom: 20 }}>
        <label className="ff-input-label-uppercase">Target Retirement Age</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter target retirement age (e.g. 60)"
          value={data.retirementAge ?? ""}
          onChange={(e) => onChange("retirementAge", e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>
    </div>
  );
}
