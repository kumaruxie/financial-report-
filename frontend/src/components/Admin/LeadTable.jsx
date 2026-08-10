import React, { useState } from "react";
import { Search, Filter, AlertTriangle, CheckCircle2, Eye, MapPin, Phone, Download, ArrowUpDown, UserCheck, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { computeReport, INR, INR_L } from "../../utils/financialEngine";

export default function LeadTable({ leads = [], onSelectLead }) {
  const { deleteLead } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // 'all' | 'high_risk' | 'moderate' | 'healthy'
  const [cityFilter, setCityFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest"); // 'newest' | 'oldest' | 'score_high' | 'score_low'

  const safeLeads = Array.isArray(leads) ? leads : [];
  const cities = Array.from(new Set(safeLeads.map((l) => l && l.city).filter(Boolean)));

  const getTime = (val) => {
    if (!val) return 0;
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Filter & Sort Logic
  const filteredLeads = safeLeads
    .filter((lead) => {
      if (!lead) return false;
      const report = computeReport(lead);
      const textMatch =
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.mobile || "").includes(searchTerm);

      if (!textMatch) return false;

      if (cityFilter !== "all" && (lead.city || "").toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }

      const score = report?.scores?.overallScore || 0;
      const isHighRisk = score < 40 || (report?.termGap || 0) > 0 || (report?.healthGap || 0) > 0;
      const isModerate = score >= 40 && score < 70 && !isHighRisk;
      const isHealthy = score >= 70 && !isHighRisk;

      if (riskFilter === "high_risk" && !isHighRisk) return false;
      if (riskFilter === "moderate" && !isModerate) return false;
      if (riskFilter === "healthy" && !isHealthy) return false;

      return true;
    })
    .sort((a, b) => {
      const rA = computeReport(a);
      const rB = computeReport(b);
      const scoreA = rA?.scores?.overallScore || 0;
      const scoreB = rB?.scores?.overallScore || 0;

      if (sortOption === "newest") return getTime(b.submittedAt || b.updatedAt) - getTime(a.submittedAt || a.updatedAt);
      if (sortOption === "oldest") return getTime(a.submittedAt || a.updatedAt) - getTime(b.submittedAt || b.updatedAt);
      if (sortOption === "score_high") return scoreB - scoreA;
      if (sortOption === "score_low") return scoreA - scoreB;
      return 0;
    });

  const exportCSV = () => {
    const headers = ["ID", "Name", "Email", "Mobile", "City", "Age", "Income", "Expenses", "TermGap", "HealthGap", "HealthScore", "SubmittedAt"];
    const csvRows = [headers.join(",")];

    filteredLeads.forEach((l) => {
      const r = computeReport(l);
      const row = [
        l.id,
        `"${l.name || ""}"`,
        `"${l.email || ""}"`,
        `"${l.mobile || ""}"`,
        `"${l.city || ""}"`,
        l.age || "",
        l.income || 0,
        l.expenses || 0,
        r?.termGap || 0,
        r?.healthGap || 0,
        r?.scores?.overallScore || 0,
        `"${new Date(l.submittedAt || Date.now()).toISOString()}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Wealth_Compass_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="ff-card-glass" style={{ borderRadius: 20, padding: 32, border: "1px solid var(--border-medium)", background: "var(--bg-surface)" }}>
      
      {/* TOOLBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 420 }}>
          <Search size={18} color="var(--text-fog)" style={{ position: "absolute", left: 16, top: 17 }} />
          <input
            type="text"
            className="ff-input-56px"
            style={{ paddingLeft: 46, height: 52, fontSize: 14, borderRadius: 12 }}
            placeholder="Search clients by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <select
            className="ff-input-56px"
            style={{ height: 52, padding: "0 16px", fontSize: 13.5, width: "auto", borderRadius: 12, cursor: "pointer" }}
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Statuses</option>
            <option value="high_risk">🔴 High Risk Flagged</option>
            <option value="moderate">🟠 Moderate Risk</option>
            <option value="healthy">🟢 Healthy Status</option>
          </select>

          <select
            className="ff-input-56px"
            style={{ height: 52, padding: "0 16px", fontSize: 13.5, width: "auto", borderRadius: 12, cursor: "pointer" }}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="ff-input-56px"
            style={{ height: 52, padding: "0 16px", fontSize: 13.5, width: "auto", borderRadius: 12, cursor: "pointer" }}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="score_high">Score: High to Low</option>
            <option value="score_low">Score: Low to High</option>
          </select>

          <button
            className="ff-btn-secondary"
            onClick={exportCSV}
            style={{ height: 52, padding: "0 18px", borderRadius: 12, fontSize: 13.5, whiteSpace: "nowrap" }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* CLIENT TABLE */}
      <div className="ff-table-wrapper" style={{ overflowX: "auto" }}>
        <table className="ff-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "16px 20px" }}>Client Name</th>
              <th style={{ padding: "16px 20px" }}>Contact & City</th>
              <th style={{ padding: "16px 20px" }}>Net Monthly Savings</th>
              <th style={{ padding: "16px 20px" }}>Health Score</th>
              <th style={{ padding: "16px 20px" }}>Risk Status</th>
              <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--text-fog)" }}>
                    <UserCheck size={24} />
                  </div>
                  <h4 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 4, fontFamily: "var(--font-serif)" }}>No Leads Found</h4>
                  <p style={{ fontSize: 14, color: "var(--text-fog)", margin: 0 }}>
                    No form submissions yet. Leads will appear here when users submit the financial assessment form.
                  </p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const report = computeReport(lead);
                const score = report?.scores?.overallScore || 0;
                const isHighRisk = score < 40 || report?.termGap > 0 || report?.healthGap > 0;
                const isModerate = score >= 40 && score < 70 && !isHighRisk;

                const dateStr = new Date(lead.submittedAt || lead.updatedAt || Date.now()).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });

                return (
                  <tr key={lead.id} className="ff-crm-row">
                    {/* Client Name & Date */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                        {lead.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 2 }}>
                        Submitted {dateStr}
                      </div>
                    </td>

                    {/* Contact & City */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13.5, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                        <span style={{ color: "var(--text-fog)", fontSize: 12 }}>☎</span> {lead.mobile || "—"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-fog)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 12 }}>📍</span> {lead.city || "—"} &bull; Age {lead.age || "—"}
                      </div>
                    </td>

                    {/* Monthly Surplus */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-teal)" }}>
                        {INR_L(report?.monthlySurplus)}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-fog)", marginTop: 2 }}>
                        Inflow: {INR_L(lead.income)}
                      </div>
                    </td>

                    {/* Health Score */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: score >= 70 ? "var(--accent-teal)" : score >= 40 ? "var(--accent-gold)" : "var(--alert-coral)" }}>
                        {score}<span style={{ fontSize: 13, color: "var(--text-fog)", fontWeight: 400 }}>/100</span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      {isHighRisk ? (
                        <span className="ff-badge ff-badge-gap" style={{ fontSize: 12, padding: "6px 12px" }}>
                          🔴 High Risk
                        </span>
                      ) : isModerate ? (
                        <span className="ff-badge ff-badge-gold" style={{ fontSize: 12, padding: "6px 12px" }}>
                          🟠 Moderate
                        </span>
                      ) : (
                        <span className="ff-badge ff-badge-ok" style={{ fontSize: 12, padding: "6px 12px" }}>
                          🟢 Healthy
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                        <button
                          className="ff-btn-ghost ff-view-report-btn"
                          onClick={() => onSelectLead(lead)}
                          style={{
                            padding: "9px 18px",
                            fontSize: 13.5,
                            borderRadius: 10,
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.25s ease"
                          }}
                        >
                          View Report &rarr;
                        </button>
                        <button
                          title="Delete Lead"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete lead for "${lead.name}"?`)) {
                              deleteLead(lead.id || lead._id);
                            }
                          }}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#EF4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
