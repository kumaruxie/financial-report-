import React, { useState } from "react";
import {
  X,
  FileText,
  PlusCircle,
  Download,
  Eye,
  Calendar,
  Trash2,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { computeReport, INR_L } from "../../utils/financialEngine";
import PdfViewer from "../Client/PdfViewer";

export default function AssessmentsDrawer({
  isOpen,
  onClose,
  onViewReport,
  onStartNewAssessment,
  onCloneAssessment
}) {
  const { user, logout } = useAuth();
  const { userAssessments, deleteUserAssessment, loadingAssessments } = useApp();

  const [pdfLead, setPdfLead] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this assessment record from your history?")) {
      await deleteUserAssessment(id);
    }
  };

  const handleClone = (assessment, e) => {
    e.stopPropagation();
    onClose();
    if (onCloneAssessment) {
      onCloneAssessment(assessment);
    }
  };

  const handleView = (assessment, e) => {
    e.stopPropagation();
    onClose();
    if (onViewReport) {
      onViewReport(assessment);
    }
  };

  return (
    <div
      className="ff-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 12, 0.8)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ff-assessments-modal"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: 20,
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(201, 154, 75, 0.1)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header Profile Section */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                color: "#07080C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                  {user?.name || "Client Account"}
                </h3>
                <span
                  style={{
                    background: "rgba(95, 168, 160, 0.15)",
                    color: "var(--accent-teal)",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3
                  }}
                >
                  <ShieldCheck size={12} /> Active
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 2 }}>
                {user?.email || user?.mobile || "Client User"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ff-btn-ghost"
            style={{
              padding: 6,
              borderRadius: 8,
              color: "var(--text-fog)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-header: Title & Quick New Button */}
        <div
          style={{
            padding: "16px 24px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              My Previous Assessments
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-fog)", margin: "2px 0 0" }}>
              {userAssessments.length} saved diagnostic record{userAssessments.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onStartNewAssessment) onStartNewAssessment();
            }}
            className="ff-btn-gold"
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <PlusCircle size={14} /> New Assessment
          </button>
        </div>

        {/* Assessments List Content */}
        <div
          style={{
            padding: "8px 24px 20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          {loadingAssessments ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-fog)" }}>
              <div className="ff-spinner" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13 }}>Loading assessments...</p>
            </div>
          ) : userAssessments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 20px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: 14,
                border: "1px dashed var(--border-subtle)"
              }}
            >
              <FileText size={32} color="var(--accent-gold)" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
              <h5 style={{ fontSize: 15, color: "var(--text-main)", margin: "0 0 6px" }}>
                No Assessments Saved Yet
              </h5>
              <p style={{ color: "var(--text-fog)", fontSize: 12.5, maxWidth: 360, margin: "0 auto 18px" }}>
                Take your 3-minute financial fitness diagnosis to evaluate your retirement readiness and goals.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onStartNewAssessment) onStartNewAssessment();
                }}
                className="ff-btn-primary"
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                Start Assessment <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            userAssessments.map((assessment, idx) => {
              const rep = computeReport(assessment);
              const isLatest = idx === 0;

              return (
                <div
                  key={assessment.id || assessment._id || idx}
                  style={{
                    background: isLatest ? "rgba(201, 154, 75, 0.05)" : "rgba(255, 255, 255, 0.02)",
                    border: isLatest ? "1px solid rgba(201, 154, 75, 0.3)" : "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isLatest ? "rgba(201, 154, 75, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: isLatest ? "var(--accent-gold)" : "var(--text-soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <FileText size={18} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-main)" }}>
                          {assessment.name || "Assessment"}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              background: "rgba(201, 154, 75, 0.2)",
                              color: "var(--accent-gold)",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 8,
                              textTransform: "uppercase"
                            }}
                          >
                            Latest
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-fog)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={12} />
                        {new Date(assessment.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Score & Metrics */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 600 }}>Score</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
                        {assessment.healthScore || rep?.healthScore || rep?.scores?.overallScore || 0}/100
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        onClick={(e) => handleView(assessment, e)}
                        className="ff-btn-wizard-ghost"
                        style={{ height: 32, padding: "0 10px", fontSize: 11.5, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}
                        title="View Full Diagnostic Report"
                      >
                        <Eye size={13} /> View
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfLead(assessment);
                        }}
                        className="ff-btn-wizard-ghost"
                        style={{ height: 32, padding: "0 9px", fontSize: 11.5, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}
                        title="Download PDF"
                      >
                        <Download size={13} /> PDF
                      </button>

                      <button
                        onClick={(e) => handleClone(assessment, e)}
                        className="ff-btn-wizard-ghost"
                        style={{ height: 32, padding: "0 9px", fontSize: 11.5, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}
                        title="Recalculate with these inputs"
                      >
                        <RefreshCw size={13} /> Retake
                      </button>

                      <button
                        onClick={(e) => handleDelete(assessment.id || assessment._id, e)}
                        className="ff-btn-ghost"
                        style={{ height: 32, width: 32, padding: 0, borderRadius: 6, color: "var(--text-fog)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Delete"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Sign Out */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#F87171",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: 0
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>

          <button
            onClick={onClose}
            className="ff-btn-ghost"
            style={{ fontSize: 12.5, color: "var(--text-fog)", padding: "4px 10px", borderRadius: 6 }}
          >
            Close
          </button>
        </div>
      </div>

      {pdfLead && (
        <PdfViewer lead={pdfLead} onClose={() => setPdfLead(null)} />
      )}
    </div>
  );
}
