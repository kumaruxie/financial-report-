import React, { useState } from "react";
import { X, Download, ShieldAlert, HeartPulse, PiggyBank, GraduationCap, CheckCircle2, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";
import InteractiveReport from "../Client/InteractiveReport";
import PdfViewer from "../Client/PdfViewer";
import { computeReport, INR, INR_L } from "../../utils/financialEngine";

export default function LeadDetailModal({ lead, onClose }) {
  const [showPdf, setShowPdf] = useState(false);
  const [activeView, setActiveView] = useState("brief"); // 'brief' | 'full'

  if (!lead) return null;
  const r = computeReport(lead);

  const genDate = new Date(lead.submittedAt || lead.updatedAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="ff-modal-overlay" style={{ background: "rgba(5, 6, 10, 0.85)", backdropFilter: "blur(12px)", zIndex: 9999 }}>
      <div className="ff-modal-card" style={{ maxWidth: 1320, width: "95vw", maxHeight: "94vh", display: "flex", flexDirection: "column", background: "#0D0E15", border: "1px solid var(--border-gold)", borderRadius: 20 }}>
        
        {/* MODAL HEADER */}
        <div style={{ padding: "20px 28px", background: "linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(13, 15, 24, 0.99) 100%)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span className="ff-badge ff-badge-gold" style={{ fontSize: 11, padding: "3px 8px" }}>Advisory Call Dossier</span>
              <span style={{ fontSize: 12, color: "var(--text-fog)" }}>Assigned to <b style={{ color: "var(--accent-gold)" }}>{lead.assignedAdminName || "Aditya Sharma"}</b></span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", margin: 0, fontFamily: "var(--font-serif)" }}>
              {lead.name} &bull; Client Advisory Brief & Gap Assessment
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", padding: 3, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setActiveView("brief")}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeView === "brief" ? "var(--accent-gold)" : "transparent",
                  color: activeView === "brief" ? "#07080C" : "var(--text-fog)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Gaps & Brief Overview
              </button>
              <button
                onClick={() => setActiveView("full")}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeView === "full" ? "var(--accent-gold)" : "transparent",
                  color: activeView === "full" ? "#07080C" : "var(--text-fog)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Full Diagnostic Report
              </button>
            </div>

            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer", padding: 4 }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: 28, overflowY: "auto", flex: 1, textAlign: "left" }}>
          
          {activeView === "brief" ? (
            <div>
              {/* CLIENT FINANCIAL CAPACITY BRIEF BAR */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "16px 20px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Monthly Income</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.income)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "16px 20px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Monthly Expenses</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--alert-coral)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.expenses)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-gold)", padding: "16px 20px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--accent-gold)", textTransform: "uppercase", fontWeight: 600 }}>Net Monthly Surplus</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-gold)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(r.monthlySurplus)}/mo</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "16px 20px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Liquid Savings</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{INR_L(lead.savings)}</div>
                </div>

                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "16px 20px", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Contact Info</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>{lead.mobile}</div>
                  <div style={{ fontSize: 12, color: "var(--text-fog)" }}>{lead.email}</div>
                </div>
              </div>

              {/* CRITICAL FINANCIAL GAPS BRIEF SECTION */}
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-serif)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldAlert size={20} color="var(--alert-coral)" /> Critical Financial Gap Audit
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
                {/* Gap 1: Term Cover */}
                <div style={{ background: "var(--bg-surface)", border: r.termGap > 0 ? "1px solid rgba(217, 119, 87, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 22, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, textTransform: "uppercase", color: r.termGap > 0 ? "var(--alert-coral)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.termGap > 0 ? "🔴 Deficit Detected" : "🟢 Protection Covered"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Life Protection</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>Term Life Insurance Cover</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: r.termGap > 0 ? "var(--alert-coral)" : "var(--accent-teal)", margin: "8px 0 4px" }}>
                    {r.termGap > 0 ? `${INR_L(r.termGap)} Uninsured Gap` : "Fully Covered"}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Recommended cover: <b>{INR_L(r.recommendedCover)}</b> (based on 15x HLV + future goals). Current active cover: <b>{INR_L(r.currentTerm)}</b>.
                  </p>
                </div>

                {/* Gap 2: Health Cover */}
                <div style={{ background: "var(--bg-surface)", border: r.healthGap > 0 ? "1px solid rgba(201, 154, 75, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 22, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, textTransform: "uppercase", color: r.healthGap > 0 ? "var(--accent-gold)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.healthGap > 0 ? "🟠 Hospitalization Deficit" : "🟢 Health Baseline Met"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Medical Coverage</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>Family Health Floater Baseline</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: r.healthGap > 0 ? "var(--accent-gold)" : "var(--accent-teal)", margin: "8px 0 4px" }}>
                    {r.healthGap > 0 ? `${INR_L(r.healthGap)} Cover Gap` : "Adequate Baseline"}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Target medical floater baseline for {lead.city}: <b>{INR_L(r.healthTarget)}</b>. Active policy: <b>{INR_L(r.currentHealth)}</b>.
                  </p>
                </div>

                {/* Gap 3: Emergency Reserve */}
                <div style={{ background: "var(--bg-surface)", border: r.emergencyGap > 0 ? "1px solid rgba(95, 168, 160, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", padding: 22, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, textTransform: "uppercase", color: r.emergencyGap > 0 ? "var(--accent-teal)" : "var(--accent-teal)", fontWeight: 700 }}>
                      {r.emergencyGap > 0 ? "🔵 Buffer Replenishment Needed" : "🟢 Reserve Complete"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Emergency Liquidity</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>9-Month Emergency Reserve</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-teal)", margin: "8px 0 4px" }}>
                    {r.emergencyGap > 0 ? `${INR_L(r.emergencyGap)} Shortfall` : "9 Months Buffer Active"}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Target emergency reserve (9 mo living expenses): <b>{INR_L(r.emergencyTarget)}</b>. Liquid savings held: <b>{INR_L(lead.savings)}</b>.
                  </p>
                </div>

                {/* Gap 4: Retirement Corpus */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-gold)", padding: 22, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, textTransform: "uppercase", color: "var(--accent-gold)", fontWeight: 700 }}>
                      🟣 Target Corpus Accumulation
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-fog)" }}>Age 60 Goal</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>Retirement Corpus Needed</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-gold)", margin: "8px 0 4px" }}>
                    {INR_L(r.retirement.corpusNeeded)} Target
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-fog)", margin: 0, lineHeight: 1.5 }}>
                    Inflation-adjusted annual expense at age 60: <b>{INR_L(r.retirement.annualExpenseAtRetirement / 12)}/mo</b>. Required annual investment: <b>{INR(r.retirement.annual)}/yr</b>.
                  </p>
                </div>
              </div>

              {/* RECOMMENDED PRODUCT ALLOCATION STRATEGY FOR CONSULTANT */}
              <div style={{ background: "linear-gradient(135deg, rgba(201, 154, 75, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)", border: "1px solid var(--border-gold)", padding: 24, borderRadius: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <PiggyBank size={20} color="var(--accent-gold)" /> Recommended Product Allocations (Consultant Talking Points)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700 }}>1. Term Protection Top-Up</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: "4px 0" }}>Pure Term Plan ({INR_L(r.termGap > 0 ? r.termGap : r.recommendedCover)})</div>
                    <div style={{ fontSize: 12, color: "var(--text-fog)" }}>Est. Premium: ~₹1,500/mo &bull; Secures income replacement</div>
                  </div>

                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 12, color: "var(--accent-teal)", fontWeight: 700 }}>2. Health Insurance Super Top-Up</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: "4px 0" }}>Family Health Floater ({INR_L(r.healthTarget)})</div>
                    <div style={{ fontSize: 12, color: "var(--text-fog)" }}>Est. Premium: ~₹1,200/mo &bull; Covers hospital inflation</div>
                  </div>

                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700 }}>3. Retirement & Goal Systematic SIP</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: "4px 0" }}>Guaranteed Plan + Equity SIP ({INR(r.totalAnnual / 12)}/mo)</div>
                    <div style={{ fontSize: 12, color: "var(--text-fog)" }}>Fully funded by client monthly surplus ({INR_L(r.monthlySurplus)})</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <InteractiveReport lead={lead} onOpenPdf={() => setShowPdf(true)} />
          )}

        </div>

        {/* MODAL FOOTER */}
        <div style={{ padding: "18px 28px", background: "rgba(13, 15, 24, 0.98)", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-fog)" }}>
            Assigned Adviser: <b style={{ color: "var(--text-main)" }}>{lead.assignedAdminName || "Aditya Sharma"}</b> &bull; Generated {genDate}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="ff-btn-gold" onClick={() => setShowPdf(true)} style={{ padding: "10px 20px", fontSize: 13.5, fontWeight: 700, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={16} /> Render 10-Page Printable PDF Dossier
            </button>
            <button className="ff-btn-ghost" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13.5, borderRadius: 10, cursor: "pointer" }}>
              Close Brief
            </button>
          </div>
        </div>

        {showPdf && <PdfViewer lead={lead} onClose={() => setShowPdf(false)} />}
      </div>
    </div>
  );
}
