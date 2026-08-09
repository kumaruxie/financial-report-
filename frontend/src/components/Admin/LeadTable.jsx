import React, { useState } from "react";
import { Search, Filter, AlertTriangle, CheckCircle2, Eye, MapPin, Phone, RefreshCw, Download, ArrowUpDown, UserCheck } from "lucide-react";
import { computeReport, INR, INR_L } from "../../utils/financialEngine";

export default function LeadTable({ leads, onSelectLead }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // 'all' | 'high_risk' | 'moderate' | 'healthy'
  const [cityFilter, setCityFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest"); // 'newest' | 'oldest' | 'score_high' | 'score_low'

  const cities = Array.from(new Set(leads.map((l) => l.city).filter(Boolean)));

  // Filter & Sort Logic
  const filteredLeads = leads
    .filter((lead) => {
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
      const isHighRisk = score < 40 || report?.termGap > 0 || report?.healthGap > 0;
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

      if (sortOption === "newest") return new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt);
      if (sortOption === "oldest") return new Date(a.submittedAt || a.updatedAt) - new Date(b.submittedAt || b.updatedAt);
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
      
      {/* NOTION-STYLE TOOLBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        {/* Search Input (52px Glass Input) */}
        <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 420 }}>
          <Search size={18} color="var(--text-fog)" style={{ position: "absolute", left: 16, top: 17 }} />
          <input
            type="text"
            className="ff-input-56px"
            style={{ paddingLeft: 46, height: 52, fontSize: 14, borderRadius: 12 }}
            placeholder="Search clients by name, city, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Risk Filter Select */}
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

          {/* City Filter Select */}
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

          {/* Sort Select */}
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

          {/* Export Action Button */}
          <button
            className="ff-btn-secondary"
            onClick={exportCSV}
            style={{ height: 52, padding: "0 18px", borderRadius: 12, fontSize: 13.5, whiteSpace: "nowrap" }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* INSTITUTIONAL CLIENT TABLE */}
      <div className="ff-table-wrapper" style={{ overflowX: "auto" }}>
        <table className="ff-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "16px 20px" }}>Client Name</th>
              <th style={{ padding: "16px 20px" }}>Contact & City</th>
              <th style={{ padding: "16px 20px" }}>Assigned Consultant</th>
              <th style={{ padding: "16px 20px" }}>Monthly Surplus</th>
              <th style={{ padding: "16px 20px" }}>Health Score</th>
              <th style={{ padding: "16px 20px" }}>Risk Status</th>
              <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--text-fog)" }}>
                    <UserCheck size={24} />
                  </div>
                  <h4 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 4, fontFamily: "var(--font-serif)" }}>No Assigned Leads Found</h4>
                  <p style={{ fontSize: 14, color: "var(--text-fog)", margin: 0 }}>
                    No client submissions matched your active admin profile or filter criteria.
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
                  month: "short"
                });

                return (
                  <tr key={lead.id} className="ff-crm-row">
                    {/* Client Name & Created Date */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                        {lead.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 2 }}>
                        Created {dateStr}
                      </div>
                    </td>

                    {/* Contact Phone & City Icons */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13.5, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                        <span style={{ color: "var(--text-fog)", fontSize: 12 }}>☎</span> {lead.mobile}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-fog)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 12 }}>📍</span> {lead.city || "Metro"} &bull; Age {lead.age || "—"}
                      </div>
                    </td>

                    {/* Assigned Consultant */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                        <UserCheck size={14} /> {lead.assignedAdminName || "Aditya Sharma"}
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

                    {/* Color-Coded Risk Badge */}
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

                    {/* Action Ghost Button */}
                    <td style={{ padding: "18px 20px", verticalAlign: "middle", textAlign: "right" }}>
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
