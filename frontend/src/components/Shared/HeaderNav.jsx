import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function HeaderNav({ activeTab, setActiveTab, onResetWizard }) {
  const { portalMode, setPortalMode } = useAuth();

  const handleGoHome = () => {
    setPortalMode("client");
    if (onResetWizard) onResetWizard();
    setActiveTab("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartForm = () => {
    setPortalMode("client");
    if (onResetWizard) onResetWizard();
    setActiveTab("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="ff-navbar no-print">
      <div className="ff-navbar-inner">
        {/* Brand Logo */}
        <div className="ff-brand" onClick={handleGoHome}>
          Your <span style={{ color: "var(--accent-gold)" }}>Wealth</span> Compass
        </div>

        {/* Header Actions */}
        <div className="ff-nav-actions">
          {portalMode === "admin" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ff-admin-tag-full">
                <ShieldCheck size={14} /> Advisory Portal (/adm)
              </span>
              <span className="ff-admin-tag-mobile">
                <ShieldCheck size={14} /> Portal (/adm)
              </span>
              <button
                className="ff-btn-ghost header-exit-btn"
                onClick={handleGoHome}
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              className="ff-btn-gold header-button"
              onClick={handleStartForm}
              style={{
                borderRadius: 14,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 700,
                background: "var(--accent-gold)",
                color: "#07080C",
                boxShadow: "0 0 30px rgba(201, 154, 75, 0.25)"
              }}
            >
              <span className="ff-btn-text-full">Assess Your Financial Health</span>
              <span className="ff-btn-text-mobile">Assess Health</span>
              <ArrowRight size={16} style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

