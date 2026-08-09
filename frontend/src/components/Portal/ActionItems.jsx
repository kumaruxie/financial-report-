import React from "react";
import { CheckSquare, Square, Calendar, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function ActionItems() {
  const { actionItems, toggleActionItem } = useApp();

  return (
    <div className="ff-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h4 style={{ fontSize: 16, color: "var(--navy-900)", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color="var(--gold-500)" /> Next Steps & Consultant Action Items
        </h4>
        <span style={{ fontSize: 12, color: "var(--emerald-600)", fontWeight: 600 }}>
          {actionItems.filter((i) => i.completed).length} / {actionItems.length} Completed
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actionItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleActionItem(item.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 12,
              borderRadius: 6,
              background: item.completed ? "var(--emerald-50)" : "var(--bg-parchment)",
              border: item.completed ? "1px solid #A7F3D0" : "1px solid var(--border-light)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ marginTop: 2, color: item.completed ? "var(--emerald-600)" : "var(--navy-600)" }}>
              {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--navy-900)",
                  textDecoration: item.completed ? "line-through" : "none"
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.description}</div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: item.completed ? "var(--emerald-600)" : "var(--gold-500)",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Calendar size={12} /> {item.dueDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
