import React from "react";
import { X, ShieldCheck, FileText, Mail, Clock, Building, CheckCircle2 } from "lucide-react";

export default function LegalModal({ activeTab = "privacy", onClose }) {
  if (!activeTab) return null;

  return (
    <div
      className="ff-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 6, 10, 0.88)",
        backdropFilter: "blur(14px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="ff-modal-card ff-legal-modal-card"
        style={{
          width: "100%",
          maxWidth: 860,
          maxHeight: "88vh",
          background: "#0D0E15",
          border: "1px solid var(--border-gold)",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
          color: "var(--text-main)",
          textAlign: "left",
          overflow: "hidden"
        }}
      >
        {/* MODAL HEADER — DEDICATED TITLE (NO TABS) */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(13, 15, 24, 0.99) 100%)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeTab === "privacy" && <ShieldCheck size={22} color="var(--accent-gold)" />}
            {activeTab === "terms" && <FileText size={22} color="var(--accent-gold)" />}
            {activeTab === "contact" && <Mail size={22} color="var(--accent-gold)" />}
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-main)" }}>
              {activeTab === "privacy" && "Privacy Policy"}
              {activeTab === "terms" && "Terms of Service"}
              {activeTab === "contact" && "Contact & Advisory Desk"}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-fog)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div
          className="ff-legal-modal-body"
          style={{
            padding: "24px 28px",
            overflowY: "auto",
            overflowX: "hidden",
            flex: 1,
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--text-fog)"
          }}
        >
          {/* VIEW 1: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Data Protection & Compliance
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", margin: "0 0 12px", fontFamily: "var(--font-serif)" }}>
                Privacy Policy
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-fog)", marginBottom: 20 }}>Last Updated: August 2026</div>

              <p>
                Your Wealth Compass (“we”, “us”, or “our”) respects your privacy. This Privacy Policy explains what information we collect, why we collect it, and how we use it when you use our website and financial diagnostic services.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>1. Information We Collect</h4>
              <p>When you complete our Financial Health Assessment or request a consultation, we may collect:</p>
              <ul style={{ paddingLeft: 20, margin: "8px 0 16px" }}>
                <li><b>Contact Data:</b> Full name, email address, phone number, and city.</li>
                <li><b>Financial Inputs:</b> Self-declared age, planned retirement age, monthly post-tax income, baseline household expenses, liquid savings/investments, and existing life/health insurance coverage.</li>
                <li><b>Technical Data:</b> Browser type, device characteristics, IP address, and interaction timestamps.</li>
              </ul>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>2. How We Use Your Data</h4>
              <p>Your inputs are processed strictly to:</p>
              <ul style={{ paddingLeft: 20, margin: "8px 0 16px" }}>
                <li>Calculate mathematical projections (Emergency buffer, Human Life Value life insurance gap, Health cover gap, and Retirement readiness).</li>
                <li>Generate your tailored, downloadable Financial Health Dossier PDF.</li>
                <li>Contact you regarding requested consultations, assessments, or report reviews.</li>
              </ul>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>3. Data Confidentiality & Protection</h4>
              <p>
                We do not sell, rent, or monetize your personal or financial data to third-party marketing companies. Data submitted is encrypted in transit and stored securely.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Contact Desk</h4>
              <p>
                For privacy questions, data updates, or deletion requests, email us at: <br />
                <a href="mailto:hello@apkacoach.com" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>hello@apkacoach.com</a>
              </p>
            </div>
          )}

          {/* VIEW 2: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Terms of Use & Regulatory Framework
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", margin: "0 0 12px", fontFamily: "var(--font-serif)" }}>
                Terms of Service
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-fog)", marginBottom: 20 }}>Last Updated: August 2026</div>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>1. Diagnostic Assessment Purpose</h4>
              <p>
                The scores, projections, and reports generated by <b>Your Wealth Compass</b> are algorithmic diagnostic tools designed for informational and educational purposes. They represent a baseline diagnostic assessment based solely on the self-declared inputs provided by you.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>2. No Guarantee of Returns</h4>
              <p>
                All projections, including retirement corpus estimations and inflation calculations, utilize industry-standard mathematical compounding models. Actual market performance, inflation rates, and investment returns will vary over time.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>3. Advisory Consultations</h4>
              <p>
                Follow-up sessions or discussions arranged through our platform are provided by qualified financial planners in accordance with relevant regulatory guidelines.
              </p>
            </div>
          )}

          {/* VIEW 3: CONTACT / ADVISORY (CLEAN INFO CARDS ONLY — NO FORM) */}
          {activeTab === "contact" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Advisory Desk & Support
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", margin: "0 0 12px", fontFamily: "var(--font-serif)" }}>
                Contact Your Wealth Compass
              </h2>
              <p style={{ margin: "0 0 20px" }}>
                Connect directly with our dedicated wealth advisory desk for assistance with your financial assessments, diagnostic scores, or personalized planning.
              </p>

              {/* DIRECT CONTACT CARDS */}
              <div className="ff-contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
                <div
                  className="ff-contact-card"
                  style={{
                    background: "rgba(201, 154, 75, 0.07)",
                    border: "1px solid var(--border-gold)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--accent-gold)", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail size={14} /> Official Advisory Email
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 4, wordBreak: "break-all" }}>
                    hello@apkacoach.com
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-fog)" }}>
                    Direct inbox for assessment queries & advisor bookings
                  </div>
                </div>

                <div
                  className="ff-contact-card"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--accent-gold)", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} /> Advisory Desk Hours
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>
                    Monday – Saturday: 9:00 AM – 7:00 PM IST
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-fog)" }}>
                    Response turnaround within 24 business hours
                  </div>
                </div>
              </div>

              {/* INSTITUTIONAL / REGULATORY DISCLOSURE CARD */}
              <div
                className="ff-contact-card"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-main)", fontWeight: 700, fontSize: 14.5, marginBottom: 8, flexWrap: "wrap" }}>
                  <Building size={16} color="var(--accent-gold)" /> Corporate Entity & Platform Desk
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-fog)", lineHeight: 1.55 }}>
                  Your Wealth Compass is powered by <b>apkacoach.com</b>. Dedicated to empowering individuals and families with institutional-grade financial diagnostics, retirement preparedness, and wealth preservation strategies.
                </p>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--accent-teal)", background: "rgba(95, 168, 160, 0.12)", padding: "8px 12px", borderRadius: 8, lineHeight: 1.4 }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Registered Financial Planning Platform &bull; SEBI RIA Aligned Framework</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
