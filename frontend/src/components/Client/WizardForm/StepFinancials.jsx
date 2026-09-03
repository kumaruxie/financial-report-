import React from "react";

export default function StepFinancials({ data, onChange, onNext }) {
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

  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: 0 }}>
          Monthly Cashflows
        </h2>
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Current Age</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter your current age"
          value={data.age || ""}
          onChange={(e) => onChange("age", e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Monthly Income</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter monthly take-home income (₹)"
          value={formatRupeeInput(data.income)}
          onChange={(e) => handleCurrencyChange("income", e.target.value)}
        />
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Monthly Expenses</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter monthly living expenses (₹)"
          value={formatRupeeInput(data.expenses)}
          onChange={(e) => handleCurrencyChange("expenses", e.target.value)}
        />
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Current Savings</label>
        <input
          type="text"
          autoComplete="off"
          className="ff-input-56px"
          placeholder="Enter total liquid savings (₹)"
          value={formatRupeeInput(data.savings)}
          onChange={(e) => handleCurrencyChange("savings", e.target.value)}
        />
      </div>
    </div>
  );
}
