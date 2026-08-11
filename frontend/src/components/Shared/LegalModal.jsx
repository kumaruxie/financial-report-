import React, { useState } from "react";
import { X, ShieldCheck, FileText, Mail, Send, CheckCircle2, Compass, PiggyBank, GraduationCap, Shield, TrendingUp, HelpCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function LegalModal({ activeTab: initialTab = "privacy", onClose }) {
  const { saveLeadSubmission, saveContactEnquiry } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab); // 'privacy' | 'terms' | 'contact'
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    topic: "Comprehensive Financial Planning",
    message: ""
  });

  if (!initialTab) return null;

  const topicsList = [
    { id: "Comprehensive Financial Planning", label: "Financial Planning", desc: "Cash flow & asset allocation", icon: Compass },
    { id: "Retirement & Pension Strategy", label: "Retirement Planning", desc: "Target corpus & SWP strategy", icon: PiggyBank },
    { id: "Child Education & Marriage Funding", label: "Goal Planning", desc: "College & marriage escalation", icon: GraduationCap },
    { id: "Life & Health Protection Audit", label: "Insurance Review", desc: "Term gap & health cover", icon: Shield },
    { id: "Investment & Portfolio Review", label: "Investment Planning", desc: "Investment & portfolio optimization", icon: TrendingUp },
    { id: "General Enquiry / Other", label: "General Enquiry", desc: "Custom question or support", icon: HelpCircle }
  ];

  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [submissionStatusText, setSubmissionStatusText] = useState("Connecting to Advisory Desk...");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setSubmissionStatusText("Connecting to Advisory Desk...");

    setTimeout(() => setSubmissionStatusText("Securing Dedicated Wealth Advisor..."), 600);
    setTimeout(() => setSubmissionStatusText("Encrypting Transmission..."), 1200);

    setTimeout(async () => {
      const enquiryPayload = {
        name: contactForm.name || "Advisory Client",
        email: contactForm.email || "",
        topic: contactForm.topic || "General Enquiry",
        message: contactForm.message || ""
      };

      const contactPayload = {
        name: contactForm.name || "Contact Enquiry User",
        email: contactForm.email || "",
        mobile: `Enquiry: ${contactForm.topic}`,
        city: "Contact Form Enquiry",
        age: "—",
        income: "0",
        expenses: "0",
        savings: "0",
        retirementAge: "60",
        termInsurance: "no",
        termAmount: "0",
        healthInsurance: "no",
        healthAmount: "0",
        goals: [
          {
            type: "Contact Inquiry",
            topic: contactForm.topic,
            message: contactForm.message
          }
        ]
      };

      try {
        if (saveContactEnquiry) saveContactEnquiry(enquiryPayload);
        if (saveLeadSubmission) await saveLeadSubmission(contactPayload);
      } catch (err) {
        console.error("Failed to save contact enquiry submission:", err);
      }

      setIsSubmittingContact(false);
      setContactSubmitted(true);

      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({ name: "", email: "", topic: "Comprehensive Financial Planning", message: "" });
      }, 5000);
    }, 1800);
  };

  return (
    <div className="ff-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(5, 6, 10, 0.85)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div
        className="ff-modal-card"
        style={{
          width: "100%",
          maxWidth: 880,
          maxHeight: "90vh",
          background: "#0D0E15",
          border: "1px solid var(--border-gold)",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          color: "var(--text-main)",
          textAlign: "left",
          overflow: "hidden"
        }}
      >
        {/* MODAL HEADER WITH TAB SWITCHER */}
        <div style={{ padding: "20px 28px", background: "linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(13, 15, 24, 0.99) 100%)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", padding: 4, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setActiveTab("privacy")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "privacy" ? "var(--accent-gold)" : "transparent",
                color: activeTab === "privacy" ? "#07080C" : "var(--text-fog)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <ShieldCheck size={15} /> Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "terms" ? "var(--accent-gold)" : "transparent",
                color: activeTab === "terms" ? "#07080C" : "var(--text-fog)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <FileText size={15} /> Terms of Service
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "contact" ? "var(--accent-gold)" : "transparent",
                color: activeTab === "contact" ? "#07080C" : "var(--text-fog)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Mail size={15} /> Contact / Advisory
            </button>
          </div>

          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer", padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div style={{ padding: "28px 32px", overflowY: "auto", flex: 1, fontSize: 14, lineHeight: 1.7, color: "var(--text-fog)" }}>

          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Data Protection & Compliance
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: "0 0 16px", fontFamily: "var(--font-serif)" }}>
                Privacy Policy
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-fog)", marginBottom: 20 }}>Last Updated: 10 August 2026</div>

              <p>
                Your Wealth Compass (“we”, “us”, or “our”) respects your privacy. This Privacy Policy explains what information we collect, why we collect it, and how we use it when you use our website and services.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Information We Collect</h4>
              <p>Depending on the services you use, we may collect information such as:</p>
              <ul style={{ paddingLeft: 20, margin: "8px 0 16px" }}>
                <li>Name</li>
                <li>Email address</li>
                <li>Age and basic profile information</li>
                <li>Income and expense information</li>
                <li>Financial goals and planning preferences</li>
                <li>Information voluntarily submitted through forms or assessments</li>
                <li>Website usage and technical information where applicable</li>
              </ul>
              <p>We only ask for information that is reasonably required to provide or improve our services.</p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>How We Use Your Information</h4>
              <p>We may use the information you provide to:</p>
              <ol style={{ paddingLeft: 20, margin: "8px 0 16px" }}>
                <li>Create and provide your financial assessment or planning report.</li>
                <li>Understand your financial goals and requirements.</li>
                <li>Contact you regarding a request, assessment, consultation, or callback.</li>
                <li>Provide customer support and respond to your enquiries.</li>
                <li>Improve our website, services, and user experience.</li>
                <li>Send service-related communications.</li>
                <li>Send promotional or marketing communications where permitted and where appropriate consent has been obtained.</li>
              </ol>
              <p style={{ fontWeight: 700, color: "var(--accent-teal)" }}>We do not sell or rent your personal information to third parties.</p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Communication & Consent</h4>
              <p>
                If you provide your details and request a consultation, we may use that information to contact you regarding your requested service. Where marketing communications are involved, you may opt out of promotional communications at any time.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Sharing of Information</h4>
              <p>
                We may share limited information with trusted service providers who help us operate our website, communication systems, analytics, hosting, or other business functions, subject to appropriate safeguards. We may also disclose information where required by applicable law.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Data Security & Retention</h4>
              <p>
                We take reasonable technical and organisational measures to protect personal information against unauthorised access, misuse, alteration, disclosure, or loss. We retain personal information only for as long as reasonably necessary for the purposes described in this Policy.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>Contact Us</h4>
              <p>For privacy-related questions or requests, contact us at:</p>
              <p style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Email: hello@apkacoach.com</p>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Terms & Conditions
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: "0 0 16px", fontFamily: "var(--font-serif)" }}>
                Terms of Service
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-fog)", marginBottom: 20 }}>Last Updated: 10 August 2026</div>

              <p>By accessing or using Your Wealth Compass, you agree to these Terms of Service.</p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>1. Use of the Service</h4>
              <p>
                Your Wealth Compass provides financial planning, financial assessment, goal-planning, educational, and related tools based on information provided by the user. You agree to provide information that is reasonably accurate and complete.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>2. Financial Information & Projections</h4>
              <p>
                Financial projections, calculations, estimates, goal values, inflation assumptions, return assumptions, retirement projections, and other outputs are <b>illustrative estimates and not guarantees of future results</b>. Actual results may differ due to market performance, inflation, taxation, and economic conditions.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>3. Educational Disclosures</h4>
              <blockquote style={{ background: "rgba(255, 255, 255, 0.03)", borderLeft: "3px solid var(--accent-gold)", padding: "12px 18px", margin: "14px 0", borderRadius: 6, color: "var(--text-main)" }}>
                “Information and planning outputs provided through the platform are intended for general financial planning and educational purposes and should not be treated as a recommendation to buy, sell, or hold any particular security or financial product.”
              </blockquote>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>4. User Responsibility</h4>
              <p>
                You are responsible for reviewing the information you provide and checking the assumptions used in your assessment. Obtain appropriate professional advice before making significant financial decisions.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>5. Intellectual Property & Prohibited Use</h4>
              <p>
                The website, branding, design, software, reports, text, graphics, and original content are owned by or licensed to Your Wealth Compass. You must not misuse the platform or reproduce content without permission.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>6. Limitation of Liability</h4>
              <p>
                To the extent permitted by applicable law, Your Wealth Compass will not be responsible for losses arising solely from reliance on estimates, assumptions, or projections generated through the platform.
              </p>

              <h4 style={{ color: "var(--text-main)", margin: "20px 0 8px", fontSize: 16 }}>7. Contact</h4>
              <p>For questions regarding these Terms, contact us at:</p>
              <p style={{ color: "var(--accent-gold)", fontWeight: 700 }}>Email: hello@apkacoach.com</p>
            </div>
          )}

          {/* TAB 3: CONTACT / ADVISORY */}
          {activeTab === "contact" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Help & Enquiries
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: "0 0 12px", fontFamily: "var(--font-serif)" }}>
                Contact Your Wealth Compass
              </h2>
              <p style={{ margin: "0 0 24px" }}>
                Have a question about your financial assessment, goals, or planning report? Our team can help you understand your assessment and next steps.
              </p>

              {/* General Enquiries Card */}
              <div style={{ background: "rgba(201, 154, 75, 0.08)", border: "1px solid var(--border-gold)", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--accent-gold)", fontWeight: 700, marginBottom: 4 }}>
                  Support & Consultation Email
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} color="var(--accent-gold)" /> hello@apkacoach.com
                </div>
              </div>

              {/* Advisory Consultation Request Form */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 16 }}>
                <h4 style={{ fontSize: 16, color: "var(--text-main)", margin: "0 0 16px" }}>Advisory / Consultation Enquiry</h4>

                {isSubmittingContact ? (
                  <div style={{ padding: "36px 24px", textAlign: "center", background: "rgba(201, 154, 75, 0.08)", border: "1px solid var(--accent-gold)", borderRadius: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      border: "3px solid rgba(201, 154, 75, 0.2)",
                      borderTopColor: "var(--accent-gold)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 16px"
                    }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>
                      Sending Advisory Enquiry
                    </div>
                    <div style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600 }}>
                      {submissionStatusText}
                    </div>
                  </div>
                ) : contactSubmitted ? (
                  <div style={{ padding: 24, textAlign: "center", background: "rgba(95, 168, 160, 0.12)", border: "1px solid var(--accent-teal)", borderRadius: 12, color: "var(--accent-teal)" }}>
                    <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Enquiry Submitted Successfully</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: "var(--text-fog)" }}>Our planning team will respond to your email shortly.</div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--text-fog)", marginBottom: 6, fontWeight: 600 }}>Your Name</label>
                        <input
                          type="text"
                          required
                          className="ff-input-56px"
                          style={{ height: 48, fontSize: 14, borderRadius: 10 }}
                          placeholder="Enter your name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--text-fog)", marginBottom: 6, fontWeight: 600 }}>Email Address</label>
                        <input
                          type="email"
                          required
                          className="ff-input-56px"
                          style={{ height: 48, fontSize: 14, borderRadius: 10 }}
                          placeholder="Enter your email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* CUSTOM STYLED ADVISORY TOPIC SELECTOR GRID */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-fog)", marginBottom: 10, fontWeight: 600 }}>
                        What would you like help with?
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                        {topicsList.map((t) => {
                          const IconComp = t.icon;
                          const isSelected = contactForm.topic === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setContactForm({ ...contactForm, topic: t.id })}
                              style={{
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: isSelected ? "rgba(201, 154, 75, 0.14)" : "rgba(255, 255, 255, 0.03)",
                                border: `1px solid ${isSelected ? "var(--accent-gold)" : "var(--border-subtle)"}`,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10
                              }}
                            >
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: isSelected ? "var(--accent-gold)" : "rgba(255,255,255,0.06)", color: isSelected ? "#07080C" : "var(--text-fog)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <IconComp size={15} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "var(--accent-gold)" : "var(--text-main)" }}>
                                  {t.label}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-fog)", marginTop: 2 }}>
                                  {t.desc}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-fog)", marginBottom: 6, fontWeight: 600 }}>Message</label>
                      <textarea
                        required
                        rows={3}
                        className="ff-input-56px"
                        style={{ height: "auto", padding: "12px 16px", fontSize: 14, borderRadius: 10 }}
                        placeholder="Tell us how we can help..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="ff-btn-gold"
                      style={{ padding: "12px 24px", fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
                    >
                      <Send size={15} /> Send Advisory Request
                    </button>
                  </form>
                )}
              </div>

              <div style={{ marginTop: 20, fontSize: 12, color: "var(--text-fog)", lineHeight: 1.5 }}>
                <b>Important:</b> An enquiry request does not by itself constitute an investment transaction or guarantee of any financial outcome.
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER BAR */}
        <div style={{ padding: "14px 28px", background: "rgba(13, 15, 24, 0.98)", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12, color: "var(--text-fog)" }}>
          <div>© 2026 Your Wealth Compass &bull; All rights reserved by apkacoach.com</div>
        </div>

      </div>
    </div>
  );
}
