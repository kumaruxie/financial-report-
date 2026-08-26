import React, { useState } from "react";
import HeaderNav from "./components/Shared/HeaderNav";
import LandingHero from "./components/Client/LandingHero";
import StepBasics from "./components/Client/WizardForm/StepBasics";
import StepFinancials from "./components/Client/WizardForm/StepFinancials";
import StepProtection from "./components/Client/WizardForm/StepProtection";
import StepGoals from "./components/Client/WizardForm/StepGoals";
import Dashboard from "./components/Portal/Dashboard";
import AdminPortal from "./components/Admin/AdminPortal";
import OtpModal from "./components/Auth/OtpModal";
import InteractiveReport from "./components/Client/InteractiveReport";
import PdfViewer from "./components/Client/PdfViewer";
import LegalModal from "./components/Shared/LegalModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Activity, TrendingUp, ShieldAlert } from "lucide-react";
import { computeReport, INR_L } from "./utils/financialEngine";
import { getCountryConfig } from "./utils/countryData";

function MainContent() {
  const { portalMode, setPortalMode } = useAuth();
  const { saveLeadSubmission } = useApp();

  const [activeTab, setActiveTab] = useState("landing");
  const [legalModalTab, setLegalModalTab] = useState(null); // null | 'privacy' | 'terms' | 'contact'
  const [wizardStep, setWizardStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Evaluating Monthly Cashflow...");

  const [basics, setBasics] = useState({ name: "", email: "", countryCode: "+91", mobile: "" });
  const [financials, setFinancials] = useState({ age: "", income: "", expenses: "", savings: "" });
  const [protection, setProtection] = useState({ termInsurance: "", termAmount: "", healthInsurance: "", healthAmount: "", city: "", retirementAge: "" });
  const [goals, setGoals] = useState([]);

  const [submittedLead, setSubmittedLead] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  React.useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const fullUrl = (path + search + hash).toLowerCase();
    const isAdmAccess =
      fullUrl.includes("/adm") ||
      fullUrl.includes("/admin") ||
      fullUrl.includes("/frm") ||
      fullUrl.includes("adm=1") ||
      fullUrl.includes("frm=1") ||
      fullUrl.includes("?adm") ||
      fullUrl.includes("?frm") ||
      fullUrl.includes("#adm") ||
      fullUrl.includes("#frm");

    if (isAdmAccess) {
      if (typeof setPortalMode === "function") setPortalMode("admin");
      setActiveTab("admin");
    }
  }, [setPortalMode]);

  const handleBasicsChange = (field, value) => {
    setStepError("");
    setBasics((prev) => ({ ...prev, [field]: value }));
  };
  const handleFinancialsChange = (field, value) => {
    setStepError("");
    setFinancials((prev) => ({ ...prev, [field]: value }));
  };
  const handleProtectionChange = (field, value) => {
    setStepError("");
    setProtection((prev) => ({ ...prev, [field]: value }));
  };

  const currentPayload = {
    name: basics.name ? basics.name.trim() : "",
    email: basics.email ? basics.email.trim() : "",
    mobile: basics.mobile ? `${basics.countryCode || "+91"} ${basics.mobile.replace(/\D/g, "")}` : "",
    age: financials.age || "",
    income: financials.income || "0",
    expenses: financials.expenses || "0",
    savings: financials.savings || "0",
    city: protection.city || "",
    retirementAge: protection.retirementAge || "60",
    termInsurance: protection.termInsurance || "no",
    termAmount: protection.termAmount || "0",
    healthInsurance: protection.healthInsurance || "no",
    healthAmount: protection.healthAmount || "0",
    goals: Array.isArray(goals) ? goals : []
  };

  const liveReport = computeReport(currentPayload);

  const validateCurrentStep = () => {
    setStepError("");
    if (wizardStep === 1) {
      const trimmedName = (basics.name || "").trim();
      if (!trimmedName) {
        setStepError("Please enter your Full Name to proceed.");
        return false;
      }
      if (trimmedName.length > 40) {
        setStepError("Full Name must not exceed 40 characters.");
        return false;
      }

      const trimmedEmail = (basics.email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setStepError("Please enter a valid Email Address (e.g. name@example.com) to proceed.");
        return false;
      }
      if (trimmedEmail.length > 80) {
        setStepError("Email Address must not exceed 80 characters.");
        return false;
      }

      const countryCfg = getCountryConfig(basics.countryCode || "+91");
      const cleanMobile = (basics.mobile || "").replace(/\D/g, "");
      if (!cleanMobile || cleanMobile.length !== countryCfg.digits) {
        setStepError(`Please enter a valid ${countryCfg.digits}-digit Mobile Number for ${countryCfg.country} to proceed.`);
        return false;
      }
    } else if (wizardStep === 2) {
      if (!financials.age || Number(financials.age) <= 0) {
        setStepError("Please enter your Current Age to proceed.");
        return false;
      }
      if (!financials.income || Number(financials.income) <= 0) {
        setStepError("Please enter your Monthly Income to proceed.");
        return false;
      }
      if (financials.expenses === "" || financials.expenses === null || Number(financials.expenses) < 0) {
        setStepError("Please enter your Monthly Expenses to proceed.");
        return false;
      }
      if (financials.savings === "" || financials.savings === null) {
        setStepError("Please enter your Current Liquid Savings (enter 0 if none).");
        return false;
      }
    } else if (wizardStep === 3) {
      if (!protection.city || !protection.city.trim()) {
        setStepError("Please select or enter your City / Location to proceed.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    setStepError("");
    if (wizardStep < 4) {
      setWizardStep((prev) => prev + 1);
    } else {
      handleWizardSubmit();
    }
  };

  const handleWizardSubmit = async () => {
    setIsProcessing(true);
    setProcessingStatus("Evaluating Monthly Cashflow...");

    const saved = await saveLeadSubmission(currentPayload);
    setSubmittedLead(saved);

    setTimeout(() => setProcessingStatus("Compounding Inflation Across Goal Horizons..."), 600);
    setTimeout(() => setProcessingStatus("Calculating Real-Rate Retirement Corpus..."), 1200);
    setTimeout(() => setProcessingStatus("Generating Diagnostic Report..."), 1800);
    setTimeout(() => {
      setIsProcessing(false);
      setWizardStep(5);
    }, 2400);
  };

  const resetWizard = () => {
    setBasics({ name: "", email: "", countryCode: "+91", mobile: "" });
    setFinancials({ age: "", income: "", expenses: "", savings: "" });
    setProtection({ termInsurance: "no", termAmount: "", healthInsurance: "no", healthAmount: "", city: "", retirementAge: "60" });
    setGoals([]);
    setSubmittedLead(null);
    setWizardStep(1);
    setActiveTab("landing");
  };

  if (portalMode === "admin" || activeTab === "admin") {
    return (
      <div className="ff-app-container">
        <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} onResetWizard={resetWizard} />
        <AdminPortal />
        <footer className="ff-footer">
          &copy; {new Date().getFullYear()} Your Wealth Compass. All rights reserved by apkacoach.com.
        </footer>
      </div>
    );
  }

  return (
    <div className="ff-app-container">
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} onResetWizard={resetWizard} />

      {activeTab === "landing" && (
        <LandingHero
          onStartWizard={() => {
            resetWizard();
            setActiveTab("wizard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOpenLegal={(tab) => setLegalModalTab(tab)}
        />
      )}

      {activeTab === "dashboard" && (
        <Dashboard
          onStartWizard={() => {
            resetWizard();
            setActiveTab("wizard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* =========================================================
         DEDICATED ASSESSMENT FORM & FULL-SCREEN REPORT VIEW
         ========================================================= */}
      {activeTab === "wizard" && (
        <div
          className="ff-wizard-wrapper"
          style={{
            minHeight: "100vh",
            padding: wizardStep === 5 ? "95px 4% 80px" : "100px 24px 80px",
            maxWidth: wizardStep === 5 ? 1380 : 840,
            margin: "0 auto",
            transition: "max-width 0.4s ease, padding 0.4s ease"
          }}
        >
          {/* Top Navigation & Back Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button
              className="ff-btn-ghost"
              onClick={() => {
                resetWizard();
              }}
              style={{ fontSize: 13.5, color: "var(--text-fog)", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8 }}
            >
              <ChevronLeft size={16} /> Back to Overview
            </button>

            {wizardStep === 5 && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="ff-btn-wizard-ghost"
                  onClick={() => resetWizard()}
                  style={{ height: 40, padding: "0 16px", fontSize: 13 }}
                >
                  Edit Inputs
                </button>
              </div>
            )}
          </div>



          {/* Compact Privacy & Security Info Card */}
          {wizardStep < 5 && !isProcessing && (
            <div
              style={{
                display: "block",
                textAlign: "center",
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(95, 168, 160, 0.08)",
                border: "1px solid rgba(95, 168, 160, 0.2)",
                marginBottom: 32,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent-teal)"
              }}
            >
              <span>Please provide accurate information to get an accurate financial report.</span>
            </div>
          )}

          {/* FORM CARD / FULL-SCREEN REPORT CONTAINER */}
          <div
            className="ff-wizard-floating-card"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              borderRadius: 20,
              padding: wizardStep === 5 ? "36px 40px" : "40px 44px",
              boxShadow: "var(--shadow-layered)",
              width: "100%"
            }}
          >
            {isProcessing ? (
              <div className="ff-processing-wrap" style={{ padding: "60px 24px" }}>
                <div className="ff-spinner"></div>
                <h3 style={{ fontSize: 24, color: "var(--text-main)", fontWeight: 600, fontFamily: "var(--font-serif)", marginBottom: 8 }}>
                  Analyzing Your Financial Profile...
                </h3>
                <p style={{ color: "var(--accent-gold)", fontSize: 14, fontFamily: "var(--font-mono)" }}>
                  {processingStatus}
                </p>
              </div>
            ) : (
              <>
                {wizardStep < 5 ? (
                  <div>
                    {/* Step Form Inputs */}
                    {wizardStep === 1 && <StepBasics data={basics} onChange={handleBasicsChange} onNext={handleNextStep} />}
                    {wizardStep === 2 && <StepFinancials data={financials} onChange={handleFinancialsChange} onNext={handleNextStep} />}
                    {wizardStep === 3 && <StepProtection data={protection} onChange={handleProtectionChange} onNext={handleNextStep} />}
                    {wizardStep === 4 && <StepGoals goals={goals} setGoals={setGoals} onSubmit={handleNextStep} />}

                    {/* Action Bar */}
                    {stepError && (
                      <div style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#F87171",
                        padding: "12px 18px",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        marginTop: 24,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}>
                        <ShieldAlert size={18} color="#F87171" style={{ flexShrink: 0 }} /> {stepError}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                      <button
                        className="ff-btn-wizard-ghost"
                        onClick={() => {
                          setStepError("");
                          if (wizardStep > 1) setWizardStep(wizardStep - 1);
                          else setActiveTab("landing");
                        }}
                        style={{ height: 52, borderRadius: 14, padding: "0 24px" }}
                      >
                        <ChevronLeft size={16} /> Back
                      </button>

                      {wizardStep < 4 ? (
                        <button
                          className="ff-btn-wizard-primary"
                          onClick={handleNextStep}
                          style={{ height: 52, borderRadius: 14, padding: "0 32px", fontSize: 15 }}
                        >
                          Continue <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="ff-btn-wizard-primary"
                          onClick={handleNextStep}
                          style={{ height: 52, borderRadius: 14, padding: "0 32px", fontSize: 15, background: "var(--accent-gold)" }}
                        >
                          Generate Diagnostic Report <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* STEP 5: FULL-SCREEN FINAL REPORT OUTPUT */
                  <div style={{ padding: "10px 0", width: "100%" }}>
                    <InteractiveReport lead={submittedLead || currentPayload} audience="client" onOpenPdf={() => setIsPdfModalOpen(true)} />

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
                      <button className="ff-btn-wizard-ghost" onClick={resetWizard}>Start New Assessment</button>
                      <button className="ff-btn-wizard-primary" onClick={() => setActiveTab("dashboard")}>
                        Go to Client Dashboard <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      {isPdfModalOpen && (
        <PdfViewer lead={submittedLead || currentPayload} onClose={() => setIsPdfModalOpen(false)} />
      )}

      {activeTab !== "landing" && portalMode !== "admin" && (
        <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--text-fog)", backgroundColor: "#07080C" }}>
          <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-main)" }}>
              Your<span style={{ color: "var(--accent-gold)" }}>Wealth</span>Compass
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, color: "var(--text-fog)", margin: "2px 0", flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ cursor: "pointer", color: "var(--text-main)", fontWeight: 600 }} onClick={() => setLegalModalTab("privacy")}>Privacy Policy</span>
              <span>&bull;</span>
              <span style={{ cursor: "pointer", color: "var(--text-main)", fontWeight: 600 }} onClick={() => setLegalModalTab("terms")}>Terms of Service</span>
              <span>&bull;</span>
              <span style={{ cursor: "pointer", color: "var(--text-main)", fontWeight: 600 }} onClick={() => setLegalModalTab("contact")}>Contact / Advisory</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 2 }}>
              &copy; {new Date().getFullYear()} Your Wealth Compass. All rights reserved by <b>apkacoach.com</b>.
            </div>
          </div>
        </footer>
      )}

      {legalModalTab && (
        <LegalModal activeTab={legalModalTab} onClose={() => setLegalModalTab(null)} />
      )}

      <OtpModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}