import React, { useState } from "react";
import HeaderNav from "./components/Shared/HeaderNav";
import ProgressBar from "./components/Shared/ProgressBar";
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

function MainContent() {
  const { portalMode, setPortalMode } = useAuth();
  const { saveLeadSubmission } = useApp();

  const [activeTab, setActiveTab] = useState("landing");
  const [legalModalTab, setLegalModalTab] = useState(null); // null | 'privacy' | 'terms' | 'contact'
  const [wizardStep, setWizardStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Evaluating Cashflow Surplus...");

  const [basics, setBasics] = useState({ name: "", email: "", mobile: "" });
  const [financials, setFinancials] = useState({ age: "", income: "", expenses: "", savings: "" });
  const [protection, setProtection] = useState({ termInsurance: "no", termAmount: "", healthInsurance: "no", healthAmount: "", city: "", retirementAge: "60" });
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

  const handleBasicsChange = (field, value) => setBasics((prev) => ({ ...prev, [field]: value }));
  const handleFinancialsChange = (field, value) => setFinancials((prev) => ({ ...prev, [field]: value }));
  const handleProtectionChange = (field, value) => setProtection((prev) => ({ ...prev, [field]: value }));

  const currentPayload = {
    name: basics.name || "Jagat Singh",
    email: basics.email || "jagat@example.com",
    mobile: basics.mobile || "9876543210",
    age: financials.age || "43",
    income: financials.income || "100000",
    expenses: financials.expenses || "20000",
    savings: financials.savings || "35000",
    city: protection.city || "Gurgaon",
    retirementAge: protection.retirementAge || "60",
    termInsurance: protection.termInsurance || "no",
    termAmount: protection.termAmount || "0",
    healthInsurance: protection.healthInsurance || "no",
    healthAmount: protection.healthAmount || "0",
    goals
  };

  const liveReport = computeReport(currentPayload);

  const handleNextStep = () => {
    if (wizardStep < 4) {
      setWizardStep((prev) => prev + 1);
    } else {
      handleWizardSubmit();
    }
  };

  const handleWizardSubmit = async () => {
    setIsProcessing(true);
    setProcessingStatus("Evaluating Cashflow Surplus...");

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
    setBasics({ name: "", email: "", mobile: "" });
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
        <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <AdminPortal />
        <footer className="ff-footer">
          &copy; {new Date().getFullYear()} Your Wealth Compass. All rights reserved by apkacoach.com.
        </footer>
      </div>
    );
  }

  return (
    <div className="ff-app-container">
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "landing" && (
        <LandingHero
          onStartWizard={() => {
            setActiveTab("wizard");
            setWizardStep(1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOpenLegal={(tab) => setLegalModalTab(tab)}
        />
      )}

      {activeTab === "dashboard" && (
        <Dashboard
          onStartWizard={() => {
            setActiveTab("wizard");
            setWizardStep(1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* =========================================================
         DEDICATED ASSESSMENT FORM PAGE (STANDALONE CLEAN VIEW)
         ========================================================= */}
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
                if (wizardStep === 5) setWizardStep(4);
                else setActiveTab("landing");
              }}
              style={{ fontSize: 13.5, color: "var(--text-fog)", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8 }}
            >
              <ChevronLeft size={16} /> {wizardStep === 5 ? "Back to Edit Goals" : "Back to Overview"}
            </button>

            {wizardStep === 5 && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="ff-btn-wizard-ghost"
                  onClick={() => window.print()}
                  style={{ height: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Activity size={15} /> Print / Save PDF
                </button>
                <button
                  className="ff-btn-wizard-ghost"
                  onClick={() => setWizardStep(1)}
                  style={{ height: 40, padding: "0 16px", fontSize: 13 }}
                >
                  Edit Inputs
                </button>
              </div>
            )}
          </div>

          {/* Stepper Track & Progress Bar */}
          {wizardStep < 5 && !isProcessing && (
            <ProgressBar currentStep={wizardStep} />
          )}

          {/* Compact Privacy & Security Info Card */}
          {wizardStep < 5 && !isProcessing && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(95, 168, 160, 0.08)",
                border: "1px solid rgba(95, 168, 160, 0.2)",
                marginBottom: 32,
                fontSize: 13,
                color: "var(--accent-teal)"
              }}
            >
              <span>ℹ</span>
              <span>Please provide accurate information to get a precise financial report.</span>
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
                    {/* Progressive Disclosure Header Banner */}
                    {wizardStep > 2 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderRadius: 10, background: "rgba(201, 154, 75, 0.08)", border: "1px solid var(--border-gold)", marginBottom: 28 }}>
                        <span style={{ fontSize: 12, color: "var(--text-fog)", textTransform: "uppercase", fontWeight: 700 }}>
                          {wizardStep === 3 && "Protection Audit Baseline"}
                          {wizardStep === 4 && "Retirement Horizon Target"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-gold)" }}>
                          {wizardStep === 3 && (protection.termInsurance === "yes" ? INR_L(protection.termAmount) : "Gap Flagged")}
                          {wizardStep === 4 && (goals.length > 0 ? `${goals.length} Goals Configured` : "Standard Horizon")}
                        </span>
                      </div>
                    )}

                    {/* Step Form Inputs */}
                    {wizardStep === 1 && <StepBasics data={basics} onChange={handleBasicsChange} onNext={handleNextStep} />}
                    {wizardStep === 2 && <StepFinancials data={financials} onChange={handleFinancialsChange} onNext={handleNextStep} />}
                    {wizardStep === 3 && <StepProtection data={protection} onChange={handleProtectionChange} onNext={handleNextStep} />}
                    {wizardStep === 4 && <StepGoals goals={goals} setGoals={setGoals} onSubmit={handleNextStep} />}

                    {/* Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
                      <button
                        className="ff-btn-wizard-ghost"
                        onClick={() => {
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
                          onClick={() => setWizardStep(wizardStep + 1)}
                          style={{ height: 52, borderRadius: 14, padding: "0 32px", fontSize: 15 }}
                        >
                          Continue <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="ff-btn-wizard-primary"
                          onClick={handleWizardSubmit}
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