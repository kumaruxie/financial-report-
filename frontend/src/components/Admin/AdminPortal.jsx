import React, { useState } from "react";
import { Users, Shield, AlertTriangle, FileCheck2, Clock, UserCheck, Filter } from "lucide-react";
import { useApp, ADMIN_LIST } from "../../context/AppContext";
import { computeReport } from "../../utils/financialEngine";
import LeadTable from "./LeadTable";
import LeadDetailModal from "./LeadDetailModal";
import SystemLogsTable from "./SystemLogsTable";

export default function AdminPortal() {
  const { leads } = useApp();
  const [selectedAdminId, setSelectedAdminId] = useState("admin_aditya");
  const [activeTab, setActiveTab] = useState("crm"); // 'crm' | 'logs'
  const [selectedLead, setSelectedLead] = useState(null);

  const activeAdminObj = ADMIN_LIST.find((a) => a.id === selectedAdminId) || ADMIN_LIST[0];

  // Filter leads assigned to currently active admin (or all if super admin selected)
  const assignedLeads = selectedAdminId === "all"
    ? leads
    : leads.filter((l) => l.assignedAdminId === selectedAdminId || (!l.assignedAdminId && selectedAdminId === "admin_aditya"));

  // Compute live KPI metrics across assigned leads
  const totalLeads = assignedLeads.length;
  let highRiskCount = 0;
  let reportsTodayCount = 0;

  assignedLeads.forEach((l) => {
    const r = computeReport(l);
    if (r && (r.termGap > 0 || r.healthGap > 0 || (r.scores && r.scores.overallScore < 50))) {
      highRiskCount++;
    }
    const isToday = new Date(l.submittedAt || l.updatedAt || Date.now()).toDateString() === new Date().toDateString();
    if (isToday) reportsTodayCount++;
  });

  const pendingCallsCount = Math.max(0, highRiskCount);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "100px 32px 80px", textAlign: "left" }}>
      
      {/* ADMIN CONSOLE HEADER WITH CONSULTANT SELECTOR */}
      <div style={{ background: "linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(13, 15, 24, 0.99) 100%)", border: "1px solid var(--border-gold)", borderRadius: 20, padding: "28px 32px", marginBottom: 32, boxShadow: "0 12px 36px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="ff-badge ff-badge-gold" style={{ fontSize: 11, padding: "4px 10px" }}>Advisory Portal & CRM</span>
              <span style={{ fontSize: 12, color: "var(--text-fog)" }}>Admin Console</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-main)", margin: "0 0 6px", fontFamily: "var(--font-serif)" }}>
              Assigned Client CRM Dashboard
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-fog)", margin: 0 }}>
              Form submissions are automatically assigned randomly to consultants. Select your admin profile to view assigned clients.
            </p>
          </div>

          {/* ADMIN CONSULTANT SELECTOR */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-gold-light)", color: "var(--accent-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-fog)", fontWeight: 600 }}>Active Admin Account</div>
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-gold)",
                  fontWeight: 700,
                  fontSize: 14.5,
                  cursor: "pointer",
                  outline: "none",
                  padding: "2px 0 0"
                }}
              >
                {ADMIN_LIST.map((admin) => (
                  <option key={admin.id} value={admin.id} style={{ background: "#0D0E15", color: "#FFF" }}>
                    {admin.name} ({admin.badge})
                  </option>
                ))}
                <option value="all" style={{ background: "#0D0E15", color: "#FFF" }}>
                  All Consultants (Super Admin View)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE TOOLBAR & METRICS HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontSize: 15, color: "var(--text-main)", fontWeight: 600 }}>
          Assigned Clients for <span style={{ color: "var(--accent-gold)" }}>{selectedAdminId === "all" ? "All Consultants" : activeAdminObj.name}</span> ({totalLeads} Lead{totalLeads === 1 ? "" : "s"})
        </div>

        {/* TAB SWITCHER */}
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", padding: 4, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("crm")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "crm" ? "var(--accent-gold)" : "transparent",
              color: activeTab === "crm" ? "#07080C" : "var(--text-fog)",
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Users size={15} /> Assigned Leads ({totalLeads})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "logs" ? "var(--accent-gold)" : "transparent",
              color: activeTab === "logs" ? "#07080C" : "var(--text-fog)",
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Shield size={15} /> System Logs
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        <div className="ff-card-glass" style={{ padding: 22, borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>Assigned Clients</span>
            <Users size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>
            {totalLeads}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent-teal)", marginTop: 4 }}>
            Directly Managed Clients
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: 22, borderRadius: 16, border: "1px solid rgba(217, 119, 87, 0.25)", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>High Gap Flagged</span>
            <AlertTriangle size={18} color="var(--alert-coral)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--alert-coral)" }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--alert-coral)", marginTop: 4 }}>
            Protection / Goal Gap Action Required
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: 22, borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>Submissions Today</span>
            <FileCheck2 size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>
            {reportsTodayCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 4 }}>
            New Lead Engine Submissions
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: 22, borderRadius: 16, border: "1px solid var(--border-gold)", background: "var(--bg-surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-gold)", fontWeight: 600 }}>Pending Advisory</span>
            <Clock size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-gold)" }}>
            {pendingCallsCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent-gold)", marginTop: 4 }}>
            High Priority Consultations
          </div>
        </div>
      </div>

      {/* MAIN DATA TAB DISPLAY */}
      {activeTab === "crm" ? (
        <LeadTable leads={assignedLeads} onSelectLead={(lead) => setSelectedLead(lead)} />
      ) : (
        <SystemLogsTable />
      )}

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
