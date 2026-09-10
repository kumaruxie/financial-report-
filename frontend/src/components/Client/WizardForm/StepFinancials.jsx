import React, { useState } from "react";
import { Info, AlertCircle, ShieldAlert } from "lucide-react";

export default function StepFinancials({ data, onChange, onNext }) {
  const [activeTip, setActiveTip] = useState(null);

  const formatRupeeInput = (rawVal) => {
    if (!rawVal) return "";
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

  const renderTooltip = (title, description, warning) => (
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: "calc(100% + 8px)",
        width: "min(300px, 80vw)",
        background: "#121524",
        border: "1px solid rgba(201, 154, 75, 0.4)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.7)",
        borderRadius: 10,
        padding: "12px 14px",
        zIndex: 50,
        color: "#E2E8F0",
        fontSize: 12,
        lineHeight: 1.5,
        pointerEvents: "none",
        animation: "fadeIn 0.15s ease-out"
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--accent-gold)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={14} /> {title}
      </div>
      <div>{description}</div>
      {warning && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed rgba(255,255,255,0.1)", color: "#F87171", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 4 }}>
          <span>⚠️</span>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );

  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: 0 }}>
          Monthly Cashflows
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--text-fog)", margin: "6px 0 0" }}>
          Accurate cashflow data ensures exact retirement and milestone goal calculations. Hover or tap the <b>(i)</b> icons for guidance.
        </p>
      </div>

      {/* CURRENT AGE */}
      <div className="ff-input-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="ff-input-label-uppercase" style={{ margin: 0 }}>Current Age</label>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setActiveTip(activeTip === "age" ? null : "age")}
              onMouseEnter={() => setActiveTip("age")}
              onMouseLeave={() => setActiveTip(null)}
              aria-label="Age info"
              style={{
                background: activeTip === "age" ? "rgba(201, 154, 75, 0.25)" : "rgba(201, 154, 75, 0.1)",
                border: "1px solid rgba(201, 154, 75, 0.35)",
                borderRadius: "50%",
                width: 22,
                height: 22,
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0
              }}
            >
              <Info size={13} />
            </button>
            {activeTip === "age" && renderTooltip(
              "Current Chronological Age",
              "Enter your current completed age in years. This defines your working timeline and years left until retirement."
            )}
          </div>
        </div>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter your current age"
          value={data.age || ""}
          onChange={(e) => onChange("age", e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>

      {/* MONTHLY INCOME */}
      <div className="ff-input-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="ff-input-label-uppercase" style={{ margin: 0 }}>Monthly Income</label>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setActiveTip(activeTip === "income" ? null : "income")}
              onMouseEnter={() => setActiveTip("income")}
              onMouseLeave={() => setActiveTip(null)}
              aria-label="Income info"
              style={{
                background: activeTip === "income" ? "rgba(201, 154, 75, 0.25)" : "rgba(201, 154, 75, 0.1)",
                border: "1px solid rgba(201, 154, 75, 0.35)",
                borderRadius: "50%",
                width: 22,
                height: 22,
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0
              }}
            >
              <Info size={13} />
            </button>
            {activeTip === "income" && renderTooltip(
              "Monthly Take-Home Income",
              "Enter net in-hand salary (after tax deductions/PF) or regular monthly cash profits withdrawn from business."
            )}
          </div>
        </div>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter monthly take-home income (₹)"
          value={formatRupeeInput(data.income)}
          onChange={(e) => handleCurrencyChange("income", e.target.value)}
        />
        <div style={{ fontSize: 11.5, color: "var(--text-fog)", marginTop: 5 }}>
          Net take-home salary or regular business cash drawings.
        </div>
      </div>

      {/* MONTHLY EXPENSES */}
      <div className="ff-input-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="ff-input-label-uppercase" style={{ margin: 0 }}>Monthly Expenses</label>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setActiveTip(activeTip === "expenses" ? null : "expenses")}
              onMouseEnter={() => setActiveTip("expenses")}
              onMouseLeave={() => setActiveTip(null)}
              aria-label="Expenses info"
              style={{
                background: activeTip === "expenses" ? "rgba(201, 154, 75, 0.25)" : "rgba(201, 154, 75, 0.1)",
                border: "1px solid rgba(201, 154, 75, 0.35)",
                borderRadius: "50%",
                width: 22,
                height: 22,
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0
              }}
            >
              <Info size={13} />
            </button>
            {activeTip === "expenses" && renderTooltip(
              "Monthly Living Expenses Only",
              "Enter regular household & living expenses (rent, groceries, electricity, lifestyle, school fees, utilities).",
              "DO NOT include loan EMIs, credit card debt, or investment SIPs here."
            )}
          </div>
        </div>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter monthly living expenses (₹)"
          value={formatRupeeInput(data.expenses)}
          onChange={(e) => handleCurrencyChange("expenses", e.target.value)}
        />
        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Living expenses only:</span> Rent, bills, groceries. (Do NOT include EMIs or SIPs)
        </div>
      </div>

      {/* CURRENT SAVINGS / LIQUID FUNDS */}
      <div className="ff-input-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label className="ff-input-label-uppercase" style={{ margin: 0 }}>Current Savings (Liquid Funds)</label>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setActiveTip(activeTip === "savings" ? null : "savings")}
              onMouseEnter={() => setActiveTip("savings")}
              onMouseLeave={() => setActiveTip(null)}
              aria-label="Savings info"
              style={{
                background: activeTip === "savings" ? "rgba(201, 154, 75, 0.25)" : "rgba(201, 154, 75, 0.1)",
                border: "1px solid rgba(201, 154, 75, 0.35)",
                borderRadius: "50%",
                width: 22,
                height: 22,
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0
              }}
            >
              <Info size={13} />
            </button>
            {activeTip === "savings" && renderTooltip(
              "Liquid & Emergency Funds",
              "Enter readily available emergency reserves: Savings Bank account balances, Fixed Deposits (FDs), Sweep deposits, and Liquid mutual funds.",
              "DO NOT include locked investments like stocks, equity mutual funds, PPF, or real estate."
            )}
          </div>
        </div>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter total liquid savings (₹)"
          value={formatRupeeInput(data.savings)}
          onChange={(e) => handleCurrencyChange("savings", e.target.value)}
        />
        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Liquid reserves only:</span> Bank accounts, FDs, emergency funds. (Exclude stocks/property)
        </div>
      </div>
    </div>
  );
}

