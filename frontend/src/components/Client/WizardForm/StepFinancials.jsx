import React, { useState } from "react";
import { Info, AlertCircle, ShieldAlert } from "lucide-react";

export default function StepFinancials({ data, onChange, onNext }) {
  const [activeTip, setActiveTip] = useState(null);

  // Derive initial/current Lakhs representation
  const getInitialLakhs = () => {
    if (data.incomeLakhs !== undefined && data.incomeLakhs !== "") {
      return String(data.incomeLakhs);
    }
    if (data.income) {
      const num = Number(data.income);
      if (!isNaN(num) && num > 0) {
        if (num >= 1000) {
          // Convert from stored Rupees to Lakhs (e.g. 30000 -> 0.3, 120000 -> 1.2)
          return String(Number((num / 100000).toFixed(2)));
        }
        return String(num);
      }
    }
    return "";
  };

  const [incomeLakhsInput, setIncomeLakhsInput] = useState(getInitialLakhs);

  // Sync if external data changes (e.g., prefilled, cloned, or reset)
  React.useEffect(() => {
    const current = getInitialLakhs();
    if (current !== incomeLakhsInput && (!incomeLakhsInput || current === "")) {
      setIncomeLakhsInput(current);
    }
  }, [data.income, data.incomeLakhs]);

  const handleIncomeLakhsChange = (rawInputText) => {
    // Only allow digits and a single decimal point
    let clean = rawInputText.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    setIncomeLakhsInput(clean);

    if (!clean || clean === ".") {
      onChange("income", "");
      onChange("incomeLakhs", clean);
      return;
    }

    const num = parseFloat(clean);
    if (!isNaN(num)) {
      // 0.3 Lakhs = 30,000 Rupees
      // If someone entered >= 1000 (e.g. 30000), treat as full rupees
      const rupeeEquivalent = num >= 1000 ? Math.round(num) : Math.round(num * 100000);
      onChange("income", String(rupeeEquivalent));
      onChange("incomeLakhs", clean);
    }
  };

  const numLakhs = parseFloat(incomeLakhsInput);
  const isValidNum = !isNaN(numLakhs) && numLakhs > 0;

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

      {/* MONTHLY INCOME (IN LAKHS) */}
      <div className="ff-input-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label className="ff-input-label-uppercase" style={{ margin: 0 }}>Monthly Income</label>
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--accent-gold)",
              background: "rgba(201, 154, 75, 0.12)",
              border: "1px solid rgba(201, 154, 75, 0.3)",
              padding: "2px 7px",
              borderRadius: 5,
              letterSpacing: "0.03em"
            }}>
              in Lakhs (₹)
            </span>
          </div>
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
              "Monthly In-Hand Income (in Lakhs)",
              "Enter net in-hand monthly salary in Lakhs. For example, enter 0.3 for ₹30,000, 0.75 for ₹75,000, or 1.5 for ₹1,50,000."
            )}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{
            position: "absolute",
            left: 18,
            fontSize: 16,
            fontWeight: 700,
            color: "var(--accent-gold)",
            pointerEvents: "none",
            userSelect: "none"
          }}>
            ₹
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="ff-input-56px"
            placeholder="e.g. 0.3 for ₹30,000 or 1.5 for ₹1.5L"
            value={incomeLakhsInput}
            onChange={(e) => handleIncomeLakhsChange(e.target.value)}
            style={{
              paddingLeft: 38,
              paddingRight: 115,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.02em"
            }}
          />
          <div style={{
            position: "absolute",
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(201, 154, 75, 0.15)",
            border: "1px solid rgba(201, 154, 75, 0.35)",
            padding: "5px 11px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent-gold)",
            pointerEvents: "none",
            userSelect: "none"
          }}>
            Lakh / mo
          </div>
        </div>

        {/* Live Calculation Preview in Words & Rupees */}
        {isValidNum && numLakhs < 100 && (
          <div style={{
            marginTop: 8,
            padding: "8px 14px",
            background: "rgba(201, 154, 75, 0.08)",
            border: "1px solid rgba(201, 154, 75, 0.28)",
            borderRadius: 8,
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>✓ Equivalent:</span>
              <span style={{ color: "var(--text-main)", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: 13.5 }}>
                ₹{Math.round(numLakhs * 100000).toLocaleString("en-IN")} / month
              </span>
            </div>
            <div style={{ color: "var(--text-fog)", fontSize: 11.5 }}>
              {numLakhs < 1
                ? `(${Math.round(numLakhs * 100)} Thousand Rupees / month)`
                : `(${numLakhs} Lakh Rupees / month)`}
            </div>
          </div>
        )}

        {/* Friendly Suggestion if user entered in whole Rupees (>100) */}
        {isValidNum && numLakhs >= 100 && (
          <div style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 8,
            color: "#FBBF24",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}>
            <span>
              ⚠️ <b>Reminder:</b> Field is in <b>Lakhs</b>. Did you mean <b>{(numLakhs / 100000).toString()} Lakh</b> (₹{numLakhs.toLocaleString("en-IN")})?
            </span>
            <button
              type="button"
              onClick={() => {
                const converted = String(Number((numLakhs / 100000).toFixed(2)));
                handleIncomeLakhsChange(converted);
              }}
              style={{
                background: "rgba(245, 158, 11, 0.25)",
                border: "1px solid #FBBF24",
                color: "#FBBF24",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Set to {(numLakhs / 100000).toString()} Lakh
            </button>
          </div>
        )}

        {!incomeLakhsInput && (
          <div style={{ fontSize: 11.5, color: "var(--text-fog)", marginTop: 6, lineHeight: 1.4 }}>
            Enter in <b style={{ color: "var(--accent-gold)" }}>Lakhs</b>. For example: <b>0.3</b> for ₹30,000 | <b>0.5</b> for ₹50,000 | <b>1</b> for ₹1 Lakh | <b>1.5</b> for ₹1,50,000.
          </div>
        )}
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

