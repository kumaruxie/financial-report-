import React, { useState } from "react";
import { User, LogOut, PlusCircle, FileText, Menu, X, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function HeaderNav({ activeTab, setActiveTab, onResetWizard, onOpenAssessments }) {
  const { user, logout, openAuthModal, portalMode, setPortalMode } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGoHome = () => {
    setPortalMode("client");
    if (onResetWizard) onResetWizard();
    setActiveTab("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartForm = () => {
    setPortalMode("client");
    if (!user) {
      openAuthModal("signup");
      return;
    }
    if (onResetWizard) onResetWizard();
    setActiveTab("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenAssessments = () => {
    setIsMobileMenuOpen(false);
    if (onOpenAssessments) onOpenAssessments();
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setActiveTab("landing");
  };

  return (
    <>
      <header className="ff-navbar no-print">
        <div className="ff-navbar-inner">
          {/* Brand Logo on the Left */}
          <div className="ff-brand" onClick={handleGoHome} style={{ cursor: "pointer" }}>
            Your<span style={{ color: "var(--accent-gold)", margin: "0 3px" }}>Wealth</span>Compass
          </div>

          {/* Corner Controls (Unified Minimalist: Sign In / Initial Dot + 3-Bars Menu) */}
          <div className="ff-nav-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <div
                className="ff-user-initial-dot"
                onClick={() => setIsMobileMenuOpen(true)}
                title={`Signed in as ${user.name}`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("signin")}
                className="ff-btn-ghost ff-corner-signin-btn"
              >
                <User size={14} />
                <span>Sign In</span>
              </button>
            )}

            {/* 3-Bars Hamburger Button */}
            <button
              className="ff-hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Navigation Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="ff-mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="ff-mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ff-mobile-nav-header">
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-serif)" }}>
                Your <span style={{ color: "var(--accent-gold)" }}>Wealth</span> Compass
              </div>
              <button
                className="ff-btn-ghost"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ padding: 6, borderRadius: 8, color: "var(--text-fog)" }}
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="ff-mobile-user-card">
                <div className="ff-user-initial-dot" style={{ width: 38, height: 38, fontSize: 16 }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-fog)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {user.email || user.mobile}
                  </div>
                </div>
              </div>
            )}

            <div className="ff-mobile-nav-links">
              <button
                className="ff-btn-gold"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleStartForm();
                }}
                style={{ width: "100%", justifyContent: "center", height: 44, borderRadius: 10, fontSize: 13.5, fontWeight: 700 }}
              >
                <PlusCircle size={16} /> {activeTab === "wizard" ? "Assess Health" : "+ New Assessment"}
              </button>

              {user && (
                <button
                  className="ff-btn-ghost"
                  onClick={handleOpenAssessments}
                  style={{ width: "100%", justifyContent: "flex-start", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 13, gap: 10, border: "1px solid var(--border-subtle)" }}
                >
                  <FileText size={16} color="var(--accent-gold)" /> My Assessments
                </button>
              )}

              <button
                className="ff-btn-ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.hash = "adm";
                  if (typeof setPortalMode === "function") setPortalMode("admin");
                }}
                style={{ width: "100%", justifyContent: "flex-start", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 13, gap: 10, color: "var(--accent-teal)", border: "1px solid var(--border-subtle)" }}
              >
                <ShieldCheck size={16} /> Advisory Portal (/adm)
              </button>

              <div style={{ height: 1, background: "var(--border-subtle)", margin: "8px 0" }} />

              {user ? (
                <button
                  className="ff-btn-ghost"
                  onClick={handleLogout}
                  style={{ width: "100%", justifyContent: "flex-start", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 13, gap: 10, color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <button
                  className="ff-btn-ghost"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal("signin");
                  }}
                  style={{ width: "100%", justifyContent: "center", height: 42, borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: "1px solid var(--border-medium)" }}
                >
                  <User size={15} /> Sign In to Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
