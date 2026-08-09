import React, { useState } from "react";
import { User, FileText, ArrowRight, ShieldCheck, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import InteractiveReport from "../Client/InteractiveReport";
import ReportHistory from "./ReportHistory";
import ActionItems from "./ActionItems";
import PdfViewer from "../Client/PdfViewer";

export default function Dashboard({ onStartWizard }) {
  const { user } = useAuth();
  const { leads, activeLead, setActiveLead } = useApp();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const currentLead = activeLead || leads[0];

  return (
    <div className="ff-main-layout">
      {/* DASHBOARD HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ color: "var(--gold-500)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Client Dashboard</span>
          <h2 className="ff-serif" style={{ fontSize: 32, color: "var(--navy-900)", marginTop: 4 }}>
            Welcome back, {user ? user.name : currentLead?.name || "Client"}
          </h2>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="ff-btn-secondary" onClick={() => setIsPdfModalOpen(true)}>
            <Download size={16} /> Download Active PDF Report
          </button>
          <button className="ff-btn-cta" onClick={onStartWizard}>
            <FileText size={16} /> Recalculate / Update Wizard <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ACTIVE PLAN INLINE INTERACTIVE REPORT */}
      {currentLead ? (
        <InteractiveReport lead={currentLead} onOpenPdf={() => setIsPdfModalOpen(true)} />
      ) : (
        <div className="ff-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>No Active Financial Plan Found</h3>
          <p style={{ color: "var(--text-muted)", margin: "12px 0 20px" }}>Run through the onboarding wizard to calculate your gap report.</p>
          <button className="ff-btn-cta" onClick={onStartWizard}>Start Wizard Onboarding</button>
        </div>
      )}

      {/* LOWER DASHBOARD GRID: HISTORY & ACTION ITEMS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
        <ReportHistory leads={leads} onSelectLead={(item) => setActiveLead(item)} />
        <ActionItems />
      </div>

      {/* PDF MODAL */}
      {isPdfModalOpen && currentLead && (
        <PdfViewer lead={currentLead} onClose={() => setIsPdfModalOpen(false)} />
      )}
    </div>
  );
}
