import React, { useState } from "react";
import {
  X, Download, ShieldAlert, HeartPulse, PiggyBank, GraduationCap, CheckCircle2,
  AlertTriangle, ArrowRight, UserCheck, User, MessageSquare, Send, Clock, Sparkles
} from "lucide-react";
import InteractiveReport from "../Client/InteractiveReport";
import PdfViewer from "../Client/PdfViewer";
import { computeReport, INR, INR_L } from "../../utils/financialEngine";
import { assignLeadAdvisorApi, updateLeadStatusAndNotesApi } from "../../services/api";

const STAGE_CONFIGS = {
  new: { label: "● New Lead", color: "var(--accent-teal)" },
  contacted: { label: "● Contacted", color: "var(--accent-gold)" },
  in_discussion: { label: "● In Discussion", color: "#60A5FA" },
  meeting_scheduled: { label: "● Meeting Scheduled", color: "#A78BFA" },
  converted: { label: "✓ Converted Client", color: "var(--accent-emerald)" },
  lost: { label: "✕ Lost / Unresponsive", color: "#F87171" }
};

export default function LeadDetailModal({
  lead,
  onClose,
  teamUsers = [],
  adminRole = "superadmin",
  adminToken = "",
  onRefresh = () => {}
}) {
  const [showPdf, setShowPdf] = useState(false);
  const [activeView, setActiveView] = useState("brief"); // 'brief' | 'full'

  // Stage and Notes State
  const [currentStage, setCurrentStage] = useState(lead?.leadStatus || "new");
  const [currentAdvisorId, setCurrentAdvisorId] = useState(lead?.assignedTo?.advisorId || "");
  const [notesList, setNotesList] = useState(lead?.advisorNotes || []);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  if (!lead) return null;
  const r = computeReport(lead);

  const genDate = new Date(lead.submittedAt || lead.updatedAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const handleStageChange = async (nextStage) => {
    setCurrentStage(nextStage);
    try {
      const res = await updateLeadStatusAndNotesApi(lead.id || lead._id, { leadStatus: nextStage }, adminToken);
      if (res && res.success) {
        setActionSuccess(`Stage updated to ${nextStage}`);
        onRefresh();
        setTimeout(() => setActionSuccess(""), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvisorAssign = async (advId) => {
    setCurrentAdvisorId(advId);
    const selectedAdvisor = teamUsers.find((u) => u.id === advId || u._id === advId);
    const payload = selectedAdvisor
      ? {
          advisorId: selectedAdvisor.id || selectedAdvisor._id,
          advisorName: selectedAdvisor.name,
          advisorEmail: selectedAdvisor.email
        }
      : {
          advisorId: null,
          advisorName: "",
          advisorEmail: ""
        };

    try {
      const res = await assignLeadAdvisorApi(lead.id || lead._id, payload, adminToken);
      if (res && res.success) {
        setActionSuccess(`Advisor assignment updated`);
        onRefresh();
        setTimeout(() => setActionSuccess(""), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSavingNote(true);
    try {
      const res = await updateLeadStatusAndNotesApi(
        lead.id || lead._id,
        { leadStatus: currentStage, note: newNoteText.trim() },
        adminToken
      );

      if (res && res.success) {
        if (res.advisorNotes) setNotesList(res.advisorNotes);
        setNewNoteText("");
        setActionSuccess("Internal note added.");
        onRefresh();
        setTimeout(() => setActionSuccess(""), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="ff-modal-overlay" style={{ background: "rgba(5, 6, 10, 0.88)", backdropFilter: "blur(14px)", zIndex: 9999 }}>
      <div className="ff-dossier-modal-card">

        {/* MODAL HEADER */}
        <div className="ff-dossier-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span className="ff-badge ff-badge-gold" style={{ fontSize: 11, padding: "3px 8px" }}>
                Client Dossier Workspace
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-subtle)", padding: "2px 7px", borderRadius: 8 }}>
                <span style={{ fontSize: 9.5, color: "var(--text-fog)", textTransform: "uppercase" }}>powered by</span>
                <img src="/apkacoach-logo-dark.png" alt="ApkaCoach" style={{ height: 13, width: "auto" }} />
              </div>
              {actionSuccess && (
                <span style={{ fontSize: 12, color: "#34D399", fontWeight: 700 }}>
                  ✓ {actionSuccess}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", margin: 0, fontFamily: "var(--font-serif)" }}>
              {lead.name} &bull; Financial Diagnostic & Advisory Brief
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", padding: 3, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setActiveView("brief")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: activeView === "brief" ? "var(--accent-gold)" : "transparent",
                  color: activeView === "brief" ? "#07080C" : "var(--text-fog)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer"
                }}
              >
                Gaps & Brief
              </button>
              <button
                onClick={() => setActiveView("full")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: activeView === "full" ? "var(--accent-gold)" : "transparent",
                  color: activeView === "full" ? "#07080C" : "var(--text-fog)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer"
                }}
              >
                Full Diagnostic
              </button>
            </div>

            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer", padding: 4 }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTROLS: ASSIGNMENT & PIPELINE STAGE BAR */}
        <div className="ff-dossier-pipeline-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {/* Stage Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-fog)", letterSpacing: "0.05em" }}>
                Stage:
              </span>
              <select
                className="ff-select"
                value={currentStage}
                onChange={(e) => handleStageChange(e.target.value)}
                style={{ height: 38, padding: "0 28px 0 10px", fontSize: 12.5, fontWeight: 700, color: "var(--accent-gold)", width: "auto" }}
              >
                <option value="new">● New Lead</option>
                <option value="contacted">● Contacted</option>
                <option value="in_discussion">● In Discussion</option>
                <option value="meeting_scheduled">● Meeting Scheduled</option>
                <option value="converted">✓ Converted Client</option>
                <option value="lost">✕ Lost / Inactive</option>
              </select>
            </div>

            {/* Advisor Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-fog)", letterSpacing: "0.05em" }}>
                Advisor:
              </span>
              {adminRole === "superadmin" ? (
                <select
                  className="ff-select"
                  value={currentAdvisorId}
                  onChange={(e) => handleAdvisorAssign(e.target.value)}
                  style={{ height: 38, padding: "0 28px 0 10px", fontSize: 12.5, fontWeight: 600, color: "var(--accent-teal)", width: "auto" }}
                >
                  <option value="">⚠️ Unassigned</option>
                  {teamUsers.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      👤 {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent-teal)" }}>
                  👤 {lead.assignedTo?.advisorName || "Assigned to You"}
                </span>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-fog)" }}>
            Lead ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>{lead.id || lead._id}</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, textAlign: "left" }}>

          {activeView === "brief" ? (
            <div>
              {/* CLIENT FINANCIAL CAPACITY BRIEF BAR */}
              <div className="ff-dossier-capacity-grid">
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px 16px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Monthly Income</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.income)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px 16px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Monthly Expenses</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--alert-coral)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.expenses)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-gold)", padding: "14px 16px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--accent-gold)", textTransform: "uppercase", fontWeight: 600 }}>Net Savings</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-gold)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(r.monthlySurplus)}/mo</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px 16px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Liquid Savings</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.savings)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px 16px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Contact Info</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>{lead.mobile || "—"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-fog)" }}>{lead.email || "—"} &bull; {lead.city || "—"}</div>
                </div>
              </div>

              {/* CRITICAL FINANCIAL GAPS BRIEF SECTION */}
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-serif)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldAlert size={18} color="var(--alert-coral)" /> Critical Financial Gap Audit
              </div>

              <div className="ff-dossier-gaps-grid">
                {/* Gap 1: Term Cover */}
                <div style={{ background: "var(--bg-surface)", border: r.termGap > 0 ? "1px solid rgba(217, 119, 87, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 18, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, textTransform: "uppercase", color: r.termGap > 0 ? "var(--alert-coral)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.termGap > 0 ? "🔴 Deficit Detected" : "🟢 Protection Covered"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Life Protection</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>Term Life Insurance Cover</div>
                  <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "var(--font-mono)", color: r.termGap > 0 ? "var(--alert-coral)" : "var(--accent-teal)", margin: "6px 0 4px" }}>
                    {r.termGap > 0 ? `${INR_L(r.termGap)} Uninsured Gap` : "Fully Covered"}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Recommended cover: <b>{INR_L(r.recommendedCover)}</b>. Current cover: <b>{INR_L(r.currentTerm)}</b>.
                  </p>
                </div>

                {/* Gap 2: Health Cover */}
                <div style={{ background: "var(--bg-surface)", border: r.healthGap > 0 ? "1px solid rgba(201, 154, 75, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 18, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, textTransform: "uppercase", color: r.healthGap > 0 ? "var(--accent-gold)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.healthGap > 0 ? "🟠 Hospitalization Deficit" : "🟢 Health Baseline Met"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Medical Coverage</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>Family Health Floater Baseline</div>
                  <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "var(--font-mono)", color: r.healthGap > 0 ? "var(--accent-gold)" : "var(--accent-teal)", margin: "6px 0 4px" }}>
                    {r.healthGap > 0 ? `${INR_L(r.healthGap)} Cover Gap` : "Adequate Baseline"}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Target medical baseline for {lead.city || "your city"}: <b>{INR_L(r.healthTarget)}</b>. Active policy: <b>{INR_L(r.currentHealth)}</b>.
                  </p>
                </div>

                {/* Gap 3: Emergency Reserve */}
                <div style={{ background: "var(--bg-surface)", border: r.emergencyGap > 0 ? "1px solid rgba(95, 168, 160, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 18, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, textTransform: "uppercase", color: r.emergencyGap > 0 ? "var(--accent-teal)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.emergencyGap > 0 ? "🔵 Buffer Needed" : "🟢 Reserve Complete"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Emergency Liquidity</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>6-Month Emergency Reserve</div>
                  <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-teal)", margin: "6px 0 4px" }}>
                    {r.emergencyGap > 0 ? `${INR_L(r.emergencyGap)} Shortfall` : "6 Months Buffer Active"}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Target emergency reserve: <b>{INR_L(r.emergencyTarget)}</b>. Liquid savings held: <b>{INR_L(lead.savings)}</b>.
                  </p>
                </div>

                {/* Gap 4: Retirement Corpus */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-gold)", padding: 18, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, textTransform: "uppercase", color: "var(--accent-gold)", fontWeight: 700 }}>
                      🟣 Target Accumulation
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Age 60 Goal</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>Retirement Corpus Needed</div>
                  <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-gold)", margin: "6px 0 4px" }}>
                    {INR_L(r.retirement.corpusNeeded)} Target
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Inflation-adjusted annual expense at age 60: <b>{INR_L(r.retirement.annualExpenseAtRetirement / 12)}/mo</b>.
                  </p>
                </div>
              </div>

              {/* ADVISOR CALL LOGS & INTERNAL NOTES THREAD */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 18, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={17} color="var(--accent-gold)" />
                  Internal Call Logs & Advisor Notes ({notesList.length})
                </div>

                {/* New Note Form */}
                <form onSubmit={handleAddNoteSubmit} style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                  <textarea
                    className="ff-textarea"
                    rows={2}
                    placeholder="Log client discussion, next action item, or consultation summary..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{ flex: "1 1 240px", minHeight: 52 }}
                  />
                  <button
                    type="submit"
                    disabled={isSavingNote || !newNoteText.trim()}
                    className="ff-btn-primary"
                    style={{ height: 52, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--accent-gold)", color: "#07080C", display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}
                  >
                    <Send size={14} /> Log Note
                  </button>
                </form>

                {/* Notes History */}
                {notesList.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--text-fog)", fontStyle: "italic", padding: "8px 0" }}>
                    No call logs or advisor notes recorded yet for this client.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {notesList.map((n, idx) => (
                      <div
                        key={n.id || idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 12,
                          padding: "12px 14px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 12.5 }}>
                              {n.authorName || "Advisor"}
                            </span>
                            <span style={{ fontSize: 9.5, padding: "2px 6px", borderRadius: 4, background: "rgba(201, 154, 75, 0.15)", color: "var(--accent-gold)", textTransform: "uppercase", fontWeight: 700 }}>
                              {n.authorRole || "advisor"}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-fog)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} /> {new Date(n.createdAt || Date.now()).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-ivory)", lineHeight: 1.5 }}>
                          {n.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <InteractiveReport lead={lead} onOpenPdf={() => setShowPdf(true)} />
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="ff-dossier-footer">
          <div style={{ fontSize: 12, color: "var(--text-fog)" }}>
            Generated on {genDate}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="ff-btn-gold" onClick={() => setShowPdf(true)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={15} /> 10-Page Dossier PDF
            </button>
            <button className="ff-btn-ghost" onClick={onClose} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>

        {showPdf && <PdfViewer lead={lead} onClose={() => setShowPdf(false)} />}
      </div>
    </div>
  );
}
