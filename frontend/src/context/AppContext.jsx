import React, { createContext, useContext, useState, useEffect } from "react";
import { submitReportApi, getLeadsApi, getAuditLogsApi, deleteLeadApi, submitEnquiryApi, getEnquiriesApi, deleteEnquiryApi } from "../services/api";

const AppContext = createContext(null);

const STORAGE_LEADS_KEY = "ff_leads_db";
const STORAGE_LOGS_KEY = "ff_audit_logs_db";
const STORAGE_ENQUIRIES_KEY = "ff_contact_enquiries_db";

export function AppProvider({ children }) {
  const [leads, setLeads] = useState(() => {
    try {
      const localSaved = localStorage.getItem(STORAGE_LEADS_KEY);
      return localSaved ? JSON.parse(localSaved) : [];
    } catch {
      return [];
    }
  });

  const [contactEnquiries, setContactEnquiries] = useState(() => {
    try {
      const localSaved = localStorage.getItem(STORAGE_ENQUIRIES_KEY);
      return localSaved ? JSON.parse(localSaved) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [activeLead, setActiveLead] = useState(null);

  // On mount: fetch real data from backend to sync
  useEffect(() => {
    async function syncBackendData() {
      const backendLeads = await getLeadsApi();
      if (backendLeads && Array.isArray(backendLeads) && backendLeads.length > 0) {
        setLeads(backendLeads);
        setActiveLead(backendLeads[0]);
        try {
          localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(backendLeads));
        } catch (e) {}
      }

      const backendEnquiries = await getEnquiriesApi();
      if (backendEnquiries && Array.isArray(backendEnquiries) && backendEnquiries.length > 0) {
        setContactEnquiries(backendEnquiries);
        try {
          localStorage.setItem(STORAGE_ENQUIRIES_KEY, JSON.stringify(backendEnquiries));
        } catch (e) {}
      }

      const backendLogs = await getAuditLogsApi();
      if (backendLogs && Array.isArray(backendLogs) && backendLogs.length > 0) {
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

  const saveContactEnquiry = async (enquiryData) => {
    const res = await submitEnquiryApi(enquiryData);
    const rawEnq = res.enquiry || {};

    const newEnquiry = {
      id: rawEnq._id || rawEnq.id || "enq_" + Date.now(),
      name: enquiryData.name || "Client User",
      email: enquiryData.email || "",
      topic: enquiryData.topic || "General Enquiry",
      message: enquiryData.message || "",
      submittedAt: rawEnq.createdAt || new Date().toISOString()
    };

    setContactEnquiries((prev) => {
      const updated = [newEnquiry, ...prev];
      try {
        localStorage.setItem(STORAGE_ENQUIRIES_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addAuditLog("Advisory Enquiry", newEnquiry.email || newEnquiry.name, "Success", `Contact enquiry: ${newEnquiry.topic}`);
    return newEnquiry;
  };

  const deleteContactEnquiry = async (enquiryId) => {
    await deleteEnquiryApi(enquiryId);
    setContactEnquiries((prev) => {
      const updated = prev.filter((e) => e.id !== enquiryId && e._id !== enquiryId);
      try {
        localStorage.setItem(STORAGE_ENQUIRIES_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addAuditLog("Enquiry Management", "Admin", "Success", `Contact enquiry deleted: ${enquiryId}`);
  };

  const saveLeadSubmission = async (leadData) => {
    const res = await submitReportApi(leadData);
    const rawReport = res.report || {};

    const newLead = {
      id: rawReport._id || rawReport.id || "lead_" + Date.now(),
      name: leadData.name || "Client User",
      email: leadData.email || "",
      mobile: leadData.mobile || "",
      age: String(leadData.age || ""),
      income: String(leadData.income || "0"),
      expenses: String(leadData.expenses || "0"),
      savings: String(leadData.savings || "0"),
      city: leadData.city || "",
      retirementAge: String(leadData.retirementAge || "60"),
      termInsurance: leadData.termInsurance || "no",
      termAmount: String(leadData.termAmount || "0"),
      healthInsurance: leadData.healthInsurance || "no",
      healthAmount: String(leadData.healthAmount || "0"),
      goals: Array.isArray(leadData.goals) ? leadData.goals : [],
      pdfUrl: res.pdfUrl || rawReport.pdfUrl,
      submittedAt: rawReport.createdAt || new Date().toISOString()
    };

    setLeads((prev) => {
      const updated = [newLead, ...prev];
      try {
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveLead(newLead);
    addAuditLog("Report Generation", newLead.email, "Success", `Lead submitted: ${newLead.name}`);
    return newLead;
  };

  const deleteLead = async (leadId) => {
    await deleteLeadApi(leadId);
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId && l._id !== leadId);
      try {
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (activeLead && (activeLead.id === leadId || activeLead._id === leadId)) {
      setActiveLead(null);
    }
    addAuditLog("Lead Management", "Admin", "Success", `Lead deleted: ${leadId}`);
  };

  return (
    <AppContext.Provider
      value={{
        leads,
        activeLead,
        setActiveLead,
        contactEnquiries,
        saveContactEnquiry,
        deleteContactEnquiry,
        auditLogs,
        addAuditLog,
        saveLeadSubmission,
        deleteLead
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
