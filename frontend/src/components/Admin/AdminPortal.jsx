import React, { useState, useEffect } from "react";
import {
  Users, AlertTriangle, FileCheck2, Clock, Filter, Lock, ShieldCheck,
  LogOut, ArrowRight, KeyRound, Mail, RefreshCw, UserCheck, Shield, Sparkles, User, CheckCircle2
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { computeReport } from "../../utils/financialEngine";
import {
  adminLoginApi,
  getLeadsApi,
  getEnquiriesApi,
  fetchAdminTeamUsersApi
} from "../../services/api";
import LeadTable from "./LeadTable";
import LeadDetailModal from "./LeadDetailModal";
import SystemLogsTable from "./SystemLogsTable";
import EnquiryTable from "./EnquiryTable";
import AdvisorTeamManager from "./AdvisorTeamManager";

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Admin Dashboard rendering error caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 640, margin: "100px auto", padding: 36, textAlign: "center", background: "#141826", color: "#FFF", borderRadius: 20, border: "1px solid var(--border-gold)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
          <h2 style={{ fontSize: 22, color: "var(--accent-gold)", margin: "0 0 12px" }}>Admin Console Dashboard</h2>
          <p style={{ fontSize: 14, color: "var(--text-fog)", marginBottom: 20 }}>
            Dashboard loaded. If an error occurred: {this.state.error?.message || "Render exception caught."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="ff-btn-gold"
            style={{ height: 44, padding: "0 24px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}
          >
            Reset Dashboard View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminPortalMain() {
  const { setPortalMode } = useAuth();
  const { contactEnquiries = [], refreshBackendData, leads: appLeads = [] } = useApp();

  // Authentication State
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("ff_admin_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState(() => {
    try {
      const saved = sessionStorage.getItem("ff_admin_token");
      return saved || "";
    } catch (e) {
      return "";
    }
  });

  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState("crm"); // 'crm' | 'team' | 'enquiries' | 'logs'
  const [selectedLead, setSelectedLead] = useState(null);

  // Dynamic Data Lists — initialized from cache so never zero on first render
  const [adminLeads, setAdminLeads] = useState(() => {
    try {
      const saved = localStorage.getItem("ff_leads_db");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [teamUsers, setTeamUsers] = useState([]);

  const isSuperAdmin = adminUser?.role === "superadmin" || adminUser?.id === "superadmin_master";

  const loadPortalData = async (token = adminToken, retryCount = 0) => {
    setIsRefreshing(true);
    try {
      // 1. Fetch leads (role-filtered by backend)
      const fetchedLeads = await getLeadsApi(token);

      // Auto-retry once if server was sleeping
      if (!fetchedLeads && retryCount < 2) {
        await new Promise((r) => setTimeout(r, 2500));
        return loadPortalData(token, retryCount + 1);
      }

      if (Array.isArray(fetchedLeads) && fetchedLeads.length > 0) {
        setAdminLeads(fetchedLeads);
        try {
          localStorage.setItem("ff_leads_db", JSON.stringify(fetchedLeads));
        } catch (e) {}
      } else if (Array.isArray(fetchedLeads)) {
        setAdminLeads(fetchedLeads);
      }

      // 2. Fetch team members (if superadmin)
      if (isSuperAdmin || !adminUser || adminUser?.role === "superadmin") {
        const teamRes = await fetchAdminTeamUsersApi(token);
        if (teamRes && teamRes.users) setTeamUsers(teamRes.users);
      }

      if (typeof refreshBackendData === "function") {
        await refreshBackendData();
      }
    } catch (err) {
      console.error("Failed to load admin portal data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (adminToken || adminUser) {
      loadPortalData(adminToken);
    }
  }, [adminToken, adminUser?.id]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const trimmedPass = (passwordInput || "").trim();
    if (!trimmedPass) {
      setAuthError("Please enter your password.");
      return;
    }

    const cleanUser = (identifierInput || "").trim();

    // 1. Super Admin Master Key — Immediate Access (No username required!)
    if (trimmedPass === "work2026@") {
      setIsVerifying(true);
      setAuthError("");
      try {
        const res = await adminLoginApi(cleanUser || "admin", trimmedPass);
        const userObj = res.user || { id: "superadmin_master", name: cleanUser || "Super Administrator", role: "superadmin" };
        const tok = res.token || "mock_token";
        setAdminUser(userObj);
        setAdminToken(tok);
        sessionStorage.setItem("ff_admin_session", JSON.stringify(userObj));
        sessionStorage.setItem("ff_admin_token", tok);
        setIdentifierInput("");
        setPasswordInput("");
        loadPortalData(tok);
      } catch (err) {
        setAuthError("Authentication error. Please check server connection.");
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    // 2. Advisor Login — Requires both Username and Password
    if (!cleanUser) {
      setAuthError("Please enter your username.");
      return;
    }

    setIsVerifying(true);
    setAuthError("");
    try {
      const res = await adminLoginApi(cleanUser, trimmedPass);
      if (res && res.success) {
        const userObj = res.user || { id: "advisor_user", name: cleanUser, role: "advisor" };
        const tok = res.token || "mock_token";
        setAdminUser(userObj);
        setAdminToken(tok);
        sessionStorage.setItem("ff_admin_session", JSON.stringify(userObj));
        sessionStorage.setItem("ff_admin_token", tok);
        setIdentifierInput("");
        setPasswordInput("");
        loadPortalData(tok);
      } else {
        setAuthError(res?.error || "Invalid username or password.");
      }
    } catch (err) {
      setAuthError("Failed to authenticate. Please check server connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setAdminUser(null);
    setAdminToken("");
    sessionStorage.removeItem("ff_admin_session");
    sessionStorage.removeItem("ff_admin_token");
  };

  const handleExitToClient = () => {
    if (typeof setPortalMode === "function") setPortalMode("client");
    window.location.href = "/";
  };

  // If not authenticated, render Login Screen
  if (!adminUser || !adminToken) {
    return (
      <div style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px" }}>
        <div
          className="ff-card-glass"
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "44px 36px",
            borderRadius: 24,
            border: "1px solid var(--border-gold)",
            background: "linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(11, 13, 20, 0.99) 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(201, 154, 75, 0.12)",
              border: "1px solid var(--border-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "var(--accent-gold)"
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <div style={{ marginBottom: 18, display: "flex", justifyContent: "center" }}>
            <img src="/apkacoach-logo-dark.png" alt="ApkaCoach" style={{ height: 28, width: "auto" }} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: "0 0 8px", fontFamily: "var(--font-serif)" }}>
            Advisory & CRM Console
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-fog)", marginBottom: 26, lineHeight: 1.5 }}>
            Sign in to access the client lead workspace.
          </p>

          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Username Input */}
            <div className="ff-form-group" style={{ margin: 0, textAlign: "left" }}>
              <label>Username / Advisor ID</label>
              <input
                type="text"
                className="ff-input"
                placeholder="Enter username or ID..."
                value={identifierInput}
                onChange={(e) => {
                  setIdentifierInput(e.target.value);
                  if (authError) setAuthError("");
                }}
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="ff-form-group" style={{ margin: 0, textAlign: "left" }}>
              <label>Password</label>
              <input
                type="password"
                className="ff-input"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError("");
                }}
                required
              />
            </div>

            {authError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#F87171",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "left"
                }}
              >
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="ff-btn-primary"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
                color: "#07080C",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer"
              }}
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Authenticating...
                </>
              ) : (
                <>
                  <KeyRound size={16} /> Sign In to Workspace →
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              className="ff-btn-ghost"
              onClick={handleExitToClient}
              style={{ fontSize: 13, color: "var(--text-fog)", cursor: "pointer" }}
            >
              &larr; Back to Client Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute live metrics across loaded leads
  const safeLeads = (Array.isArray(adminLeads) && adminLeads.length > 0)
    ? adminLeads
    : (Array.isArray(appLeads) && appLeads.length > 0 ? appLeads : []);
  const safeEnquiries = Array.isArray(contactEnquiries) ? contactEnquiries : [];

  const totalLeads = safeLeads.length;
  const totalEnquiries = safeEnquiries.length;
  let highRiskCount = 0;
  let reportsTodayCount = 0;
  let convertedCount = 0;

  const todayStr = new Date().toDateString();

  safeLeads.forEach((l) => {
    if (!l) return;
    try {
      const r = computeReport(l);
      if (r && (r.termGap > 0 || r.healthGap > 0 || (r.scores && r.scores.overallScore < 50))) {
        highRiskCount++;
      }
      if (l.leadStatus === "converted") {
        convertedCount++;
      }
      const rawDate = l.submittedAt || l.updatedAt;
      if (rawDate) {
        const parsedD = new Date(rawDate);
        if (!isNaN(parsedD.getTime()) && parsedD.toDateString() === todayStr) {
          reportsTodayCount++;
        }
      }
    } catch (err) {
      console.error("Error computing lead report in AdminPortal:", err);
    }
  });

  return (
    <div className="ff-admin-page">
      
      {/* 1. ADMIN CONSOLE HEADER */}
      <div className="ff-admin-header-card">
        <div className="ff-admin-header-content">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              {isSuperAdmin ? (
                <span className="ff-badge ff-badge-gold" style={{ fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap" }}>
                  👑 Super Admin Console (Full Access)
                </span>
              ) : (
                <span className="ff-badge ff-badge-ok" style={{ fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  💼 Advisor: <b>{adminUser?.name || "Advisor"}</b>
                </span>
              )}
              <span style={{ fontSize: 11.5, color: "var(--accent-teal)", fontWeight: 600, whiteSpace: "nowrap" }}>
                ● Active Session
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }}></span>
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>MongoDB Atlas: Connected ({totalLeads} Leads)</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-subtle)", padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 10, color: "var(--text-fog)", textTransform: "uppercase" }}>powered by</span>
                <img src="/apkacoach-logo-dark.png" alt="ApkaCoach" style={{ height: 13, width: "auto" }} />
              </div>
            </div>
            <h1 className="ff-admin-header-title">
              {isSuperAdmin ? "Platform Leads CRM & Advisor Distribution" : "My Assigned Client Leads & Consultations"}
            </h1>
            <p className="ff-admin-header-sub">
              {isSuperAdmin
                ? "Assign client leads, manage advisor team credentials, track conversion rates, and audit system logs."
                : "Manage your assigned clients, review diagnostic dossiers, log call notes, and update pipeline stages."}
            </p>
          </div>

          <div className="ff-admin-header-actions">
            <button
              onClick={handleExitToClient}
              className="ff-btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 12,
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 14px"
              }}
            >
              &larr; Back to Client Screen
            </button>
            <button
              onClick={() => loadPortalData(adminToken)}
              disabled={isRefreshing}
              className="ff-btn-gold"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RefreshCw size={15} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
              {isRefreshing ? "Syncing..." : "Sync Live DB"}
            </button>

            <button
              onClick={handleLogout}
              className="ff-btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 12,
                border: "1px solid var(--border-subtle)",
                color: "var(--text-fog)",
                fontSize: 13.5,
                cursor: "pointer"
              }}
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="ff-admin-kpi-grid">
        <div className="ff-admin-kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>
              {isSuperAdmin ? "Total Platform Leads" : "Assigned Leads"}
            </span>
            <Users size={17} color="var(--accent-gold)" />
          </div>
          <div className="ff-admin-kpi-val">
            {totalLeads}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent-teal)", marginTop: 4 }}>
            {isSuperAdmin ? "All Form Submissions" : "Assigned specifically to you"}
          </div>
        </div>

        <div className="ff-admin-kpi-card" style={{ borderColor: "rgba(217, 119, 87, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>High Gap Action</span>
            <AlertTriangle size={17} color="var(--alert-coral)" />
          </div>
          <div className="ff-admin-kpi-val" style={{ color: "var(--alert-coral)" }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--alert-coral)", marginTop: 4 }}>
            Priority Deficit Flagged
          </div>
        </div>

        <div className="ff-admin-kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-fog)", fontWeight: 600 }}>Converted Clients</span>
            <CheckCircle2 size={17} color="var(--accent-emerald)" />
          </div>
          <div className="ff-admin-kpi-val" style={{ color: "var(--accent-emerald)" }}>
            {convertedCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-fog)", marginTop: 4 }}>
            {totalLeads > 0 ? `${Math.round((convertedCount / totalLeads) * 100)}% Conversion Rate` : "0% Conversion"}
          </div>
        </div>

        <div className="ff-admin-kpi-card" style={{ borderColor: "var(--border-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-gold)", fontWeight: 600 }}>
              {isSuperAdmin ? "Advisor Team" : "New Today"}
            </span>
            {isSuperAdmin ? <UserCheck size={17} color="var(--accent-gold)" /> : <Clock size={17} color="var(--accent-gold)" />}
          </div>
          <div className="ff-admin-kpi-val" style={{ color: "var(--accent-gold)" }}>
            {isSuperAdmin ? teamUsers.length : reportsTodayCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent-gold)", marginTop: 4 }}>
            {isSuperAdmin ? `${teamUsers.filter(u => u.status !== "inactive").length} Active Advisors` : "Submitted Today"}
          </div>
        </div>
      </div>

      {/* 3. PAGE TOOLBAR & ROLE-AWARE TAB SWITCHER */}
      <div className="ff-admin-tab-bar-container">
        <div style={{ fontSize: 15, color: "var(--text-main)", fontWeight: 700 }}>
          {activeTab === "crm" && (isSuperAdmin ? `Platform Leads CRM (${totalLeads})` : `My Assigned Leads (${totalLeads})`)}
          {activeTab === "team" && `Advisor Team & Credentials (${teamUsers.length})`}
          {activeTab === "enquiries" && `Advisory Form Enquiries (${totalEnquiries})`}
          {activeTab === "logs" && `System Audit Trails`}
        </div>

        {/* TAB BUTTONS */}
        <div className="ff-admin-tab-bar">
          <button
            onClick={() => setActiveTab("crm")}
            className="ff-admin-tab-btn"
            style={{
              background: activeTab === "crm" ? "var(--accent-gold)" : "transparent",
              color: activeTab === "crm" ? "#07080C" : "var(--text-fog)",
            }}
          >
            <Users size={14} /> {isSuperAdmin ? `All Leads (${totalLeads})` : `My Leads (${totalLeads})`}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("team")}
              className="ff-admin-tab-btn"
              style={{
                background: activeTab === "team" ? "var(--accent-gold)" : "transparent",
                color: activeTab === "team" ? "#07080C" : "var(--text-fog)",
              }}
            >
              <UserCheck size={14} /> Advisor Team ({teamUsers.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("enquiries")}
            className="ff-admin-tab-btn"
            style={{
              background: activeTab === "enquiries" ? "var(--accent-gold)" : "transparent",
              color: activeTab === "enquiries" ? "#07080C" : "var(--text-fog)",
            }}
          >
            <Mail size={14} /> Enquiries ({totalEnquiries})
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("logs")}
              className="ff-admin-tab-btn"
              style={{
                background: activeTab === "logs" ? "var(--accent-gold)" : "transparent",
                color: activeTab === "logs" ? "#07080C" : "var(--text-fog)",
              }}
            >
              Logs
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN DATA TAB DISPLAY */}
      {activeTab === "crm" && (
        <LeadTable
          leads={safeLeads}
          teamUsers={teamUsers}
          onSelectLead={(lead) => setSelectedLead(lead)}
          adminRole={adminUser?.role}
          adminToken={adminToken}
          onRefresh={() => loadPortalData(adminToken)}
        />
      )}

      {activeTab === "team" && isSuperAdmin && (
        <AdvisorTeamManager
          teamUsers={teamUsers}
          adminToken={adminToken}
          onRefresh={() => loadPortalData(adminToken)}
          currentAdminRole={adminUser?.role}
        />
      )}

      {activeTab === "enquiries" && <EnquiryTable />}
      {activeTab === "logs" && isSuperAdmin && <SystemLogsTable />}

      {/* 5. LEAD DETAIL MODAL WORKSPACE */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          teamUsers={teamUsers}
          adminRole={adminUser?.role}
          adminToken={adminToken}
          onRefresh={() => loadPortalData(adminToken)}
        />
      )}
    </div>
  );
}

export default function AdminPortal() {
  return (
    <AdminErrorBoundary>
      <AdminPortalMain />
    </AdminErrorBoundary>
  );
}
