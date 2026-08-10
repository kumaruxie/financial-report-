import React, { createContext, useContext, useState, useEffect } from "react";
import { submitReportApi, getLeadsApi, getAuditLogsApi } from "../services/api";

const AppContext = createContext(null);

const STORAGE_LEADS_KEY = "ff_leads_db";
const STORAGE_LOGS_KEY = "ff_audit_logs_db";

export const ADMIN_LIST = [
  { id: "admin_aditya", name: "Aditya Sharma", email: "aditya@wealthcompass.com", badge: "Senior Wealth Consultant" },
  { id: "admin_vikram", name: "Vikram Mehta", email: "vikram@wealthcompass.com", badge: "Insurance & Risk Specialist" },
  { id: "admin_neha",   name: "Neha Gupta",   email: "neha@wealthcompass.com", badge: "Retirement & Portfolio Strategist" }
];

const INITIAL_LOGS = [];

const INITIAL_LEADS = [];

export function AppProvider({ children }) {
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LEADS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOGS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [activeLead, setActiveLead] = useState(leads[0] || null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    } catch (e) {}
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  useEffect(() => {
    async function syncBackendData() {
      const backendLeads = await getLeadsApi();
      if (backendLeads && backendLeads.length > 0) {
        setLeads(backendLeads);
        setActiveLead(backendLeads[0]);
      }
      const backendLogs = await getAuditLogsApi();
      if (backendLogs && backendLogs.length > 0) {
        setAuditLogs(backendLogs);
      }
    }
    syncBackendData();
  }, []);

  const addAuditLog = (type, user, status, details) => {
    const newLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      type,
      user: user || "Anonymous",
      status,
      details
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const saveLeadSubmission = async (leadData) => {
    const res = await submitReportApi(leadData);
    const rawReport = res.report || {};
    const fin = rawReport.financials || {};
    const prot = rawReport.protection || {};

    // Randomly assign lead to one of the available admins
    const randomAdmin = ADMIN_LIST[Math.floor(Math.random() * ADMIN_LIST.length)];
    const assignedAdminId = rawReport.assignedAdminId || randomAdmin.id;
    const assignedAdminName = rawReport.assignedAdminName || randomAdmin.name;

    const newLead = {
      id: rawReport._id || rawReport.id || "lead_" + Date.now(),
      name: leadData.name || fin.name || "Client User",
      email: leadData.email || fin.email || "",
      mobile: leadData.mobile || fin.mobile || "",
      age: String(leadData.age || fin.age || "30"),
      income: String(leadData.income || fin.income || "0"),
      expenses: String(leadData.expenses || fin.expenses || "0"),
      savings: String(leadData.savings || fin.savings || "0"),
      city: leadData.city || fin.city || "",
      retirementAge: String(leadData.retirementAge || prot.retirementAge || "60"),
      termInsurance: leadData.termInsurance || prot.termInsurance || "no",
      termAmount: String(leadData.termAmount || prot.termAmount || "0"),
      healthInsurance: leadData.healthInsurance || prot.healthInsurance || "no",
      healthAmount: String(leadData.healthAmount || prot.healthAmount || "0"),
      goals: Array.isArray(leadData.goals) ? leadData.goals : [],
      pdfUrl: res.pdfUrl || rawReport.pdfUrl,
      assignedAdminId,
      assignedAdminName,
      submittedAt: rawReport.createdAt || new Date().toISOString()
    };

    setLeads((prev) => [newLead, ...prev]);
    setActiveLead(newLead);
    addAuditLog("Report Generation", newLead.email, "Success", `Lead submitted & assigned to ${assignedAdminName}`);
    return newLead;
  };

  return (
    <AppContext.Provider
      value={{
        leads,
        activeLead,
        setActiveLead,
        auditLogs,
        addAuditLog,
        saveLeadSubmission
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
