import React from "react";
import { Plus, Trash2, GraduationCap, Heart, Home } from "lucide-react";
import { GOAL_TYPES } from "../../../utils/financialEngine";

export default function StepGoals({ goals, setGoals }) {
  const formatRupeeInput = (rawVal) => {
    if (!rawVal) return "";
    const cleanNum = String(rawVal).replace(/[^0-9]/g, "");
    if (!cleanNum) return "";
    return "₹" + Number(cleanNum).toLocaleString("en-IN");
  };

  const addGoal = () => {
    const newId = "g_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    setGoals([
      ...goals,
      {
        id: newId,
        type: "education",
        childClass: 5,
        ugCost: 1000000,
        pgCost: 500000,
        childAge: 5,
        years: 5,
        cost: 500000
      }
    ]);
  };

  const removeGoal = (id) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const updateGoal = (id, patch) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", marginBottom: 8 }}>
          Milestone Goals
        </h2>
        <p style={{ fontSize: 14.5, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
          Set your future goals and timeline targets.
        </p>
      </div>

      {goals.map((goal, idx) => {
        const meta = GOAL_TYPES[goal.type] || GOAL_TYPES.education;
        const IconComp = meta.Icon || GraduationCap;

        return (
          <div
            key={goal.id}
            style={{
              background: "rgba(19, 21, 32, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201, 154, 75, 0.12)", border: "1px solid rgba(201, 154, 75, 0.3)", color: "var(--accent-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconComp size={20} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)", display: "block" }}>
                    Goal #{idx + 1}: {meta.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-fog)" }}>Timeline evaluation</span>
                </div>
              </div>

              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 10,
                    color: "#F87171",
                    cursor: "pointer",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                  title="Remove Goal"
                >
                  <Trash2 size={15} /> Remove
                </button>
              )}
            </div>

            <div className="ff-input-group">
              <label className="ff-input-label-uppercase">Goal Type</label>
              <select
                className="ff-input-56px"
                style={{ background: "#151824", color: "var(--text-main)", cursor: "pointer", appearance: "auto" }}
                value={goal.type}
                onChange={(e) => updateGoal(goal.id, { type: e.target.value })}
              >
                {Object.entries(GOAL_TYPES).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: "#151824", color: "#FFFFFF" }}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* EDUCATION FIELDS */}
            {goal.type === "education" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">Child's Class</label>
                  <select
                    className="ff-input-56px"
                    style={{ background: "#151824", color: "var(--text-main)", cursor: "pointer", appearance: "auto" }}
                    value={goal.childClass || 5}
                    onChange={(e) => updateGoal(goal.id, { childClass: e.target.value })}
                  >
                    {/* Restrict to Class 1 through Class 7 to ensure at least a 5-year gap before Class 12 */}
                    {Array.from({ length: 7 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c} style={{ background: "#151824", color: "#FFFFFF" }}>
                        Class {c} ({12 - c} yrs to college)
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: "var(--accent-gold)", marginTop: 4, display: "block" }}>
                    Minimum 5-year timeline required for proper college investment planning.
                  </span>
                </div>

                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">College Cost Today (₹)</label>
                  <input
                    type="text"
                    className="ff-input-56px"
                    placeholder="e.g. ₹10,00,000"
                    value={formatRupeeInput(goal.ugCost)}
                    onChange={(e) => updateGoal(goal.id, { ugCost: e.target.value.replace(/[^0-9]/g, "") })}
                  />
                </div>
              </div>
            )}

            {/* MARRIAGE FIELDS */}
            {goal.type === "marriage" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">Child's Age</label>
                  <input
                    type="text"
                    className="ff-input-56px"
                    placeholder="e.g. 5 yrs"
                    value={goal.childAge}
                    onChange={(e) => updateGoal(goal.id, { childAge: e.target.value.replace(/[^0-9]/g, "") })}
                  />
                </div>

                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">Marriage Budget Today (₹)</label>
                  <input
                    type="text"
                    className="ff-input-56px"
                    placeholder="e.g. ₹15,00,000"
                    value={formatRupeeInput(goal.cost)}
                    onChange={(e) => updateGoal(goal.id, { cost: e.target.value.replace(/[^0-9]/g, "") })}
                  />
                </div>
              </div>
            )}

            {/* HOUSE FIELDS */}
            {goal.type === "house" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">Years to Goal</label>
                  <input
                    type="text"
                    className="ff-input-56px"
                    placeholder="e.g. 5 yrs"
                    value={goal.years}
                    onChange={(e) => updateGoal(goal.id, { years: e.target.value.replace(/[^0-9]/g, "") })}
                  />
                </div>

                <div className="ff-input-group">
                  <label className="ff-input-label-uppercase">Property Cost Today (₹)</label>
                  <input
                    type="text"
                    className="ff-input-56px"
                    placeholder="e.g. ₹40,00,000"
                    value={formatRupeeInput(goal.cost)}
                    onChange={(e) => updateGoal(goal.id, { cost: e.target.value.replace(/[^0-9]/g, "") })}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addGoal}
        style={{
          width: "100%",
          height: 52,
          borderRadius: 14,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1.5px dashed rgba(201, 154, 75, 0.4)",
          color: "var(--accent-gold)",
          fontWeight: 600,
          fontSize: 14.5,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s ease"
        }}
      >
        <Plus size={18} /> Add Another Life Goal
      </button>
    </div>
  );
}
