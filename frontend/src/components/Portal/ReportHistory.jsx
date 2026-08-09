import React from "react";
import { Clock, FileText, ArrowUpRight } from "lucide-react";
import { computeReport, INR } from "../../utils/financialEngine";

export default function ReportHistory({ leads, onSelectLead }) {
  return (
    <div className="ff-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h4 style={{ fontSize: 16, color: "var(--navy-900)", display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={18} color="var(--gold-500)" /> Generated Report History
        </h4>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{leads.length} Saved Records</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {leads.map((item) => {
          const report = computeReport(item);
          return (
            <div
              key={item.id}
              onClick={() => onSelectLead(item)}
              style={{
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              className="ff-history-item"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold-100)", color: "var(--gold-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--navy-900)" }}>{item.name}'s Financial Plan</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Generated on {new Date(item.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy-900)", fontFamily: "var(--font-mono)" }}>
                    {INR(report?.totalMonthly)} / mo
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Score: {report?.healthScore}/100
                  </div>
                </div>
                <ArrowUpRight size={18} color="var(--navy-600)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
