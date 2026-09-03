import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  submitReportApi,
  getLeadsApi,
  getAuditLogsApi,
  deleteLeadApi,
  submitEnquiryApi,
  getEnquiriesApi,
  deleteEnquiryApi,
  getMyAssessmentsApi,
  deleteAssessmentApi
} from "../services/api";

const AppContext = createContext(null);

const STORAGE_LEADS_KEY = "ff_leads_db";
const STORAGE_LOGS_KEY = "ff_audit_logs_db";
const STORAGE_ENQUIRIES_KEY = "ff_contact_enquiries_db";
const STORAGE_USER_ASSESSMENTS_KEY = "ff_user_assessments_db";

export function AppProvider({ children }) {
  const [leads, setLeads] = useState(() => {
    try {
      const localSaved = localStorage.getItem(STORAGE_LEADS_KEY);
      return localSaved ? JSON.parse(localSaved) : [];
    } catch {
      return [];
    }
  });

  const [userAssessments, setUserAssessments] = useState(() => {
    try {
      const localSaved = localStorage.getItem(STORAGE_USER_ASSESSMENTS_KEY);
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
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const refreshBackendData = async () => {
    const backendLeads = await getLeadsApi();
    if (backendLeads && Array.isArray(backendLeads)) {
      setLeads(backendLeads);
      if (backendLeads.length > 0 && !activeLead) {
        setActiveLead(backendLeads[0]);
      }
      try {
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(backendLeads));
      } catch (e) {}
    }

    const backendEnquiries = await getEnquiriesApi();
    if (backendEnquiries && Array.isArray(backendEnquiries)) {
      setContactEnquiries(backendEnquiries);
      try {
        localStorage.setItem(STORAGE_ENQUIRIES_KEY, JSON.stringify(backendEnquiries));
      } catch (e) {}
    }

    const backendLogs = await getAuditLogsApi();
    if (backendLogs && Array.isArray(backendLogs)) {
      setAuditLogs(backendLogs);
    }
  };

  const fetchUserAssessments = useCallback(async (userData) => {
    if (!userData || (!userData.id && !userData.uid && !userData.email && !userData.mobile)) {
      setUserAssessments([]);
      return;
    }
    setLoadingAssessments(true);
    try {
      const uId = userData.id || userData.uid || "";
      const uEmail = userData.email || "";
      const uMob = userData.mobile || "";

      const backendData = await getMyAssessmentsApi({
        userId: uId,
        email: uEmail,
        mobile: uMob
      });

      if (backendData && Array.isArray(backendData)) {
        setUserAssessments(backendData);
        try {
          localStorage.setItem(STORAGE_USER_ASSESSMENTS_KEY, JSON.stringify(backendData));
        } catch (e) {}
      } else {
        // Filter local leads as fallback
        try {
          const localSaved = localStorage.getItem(STORAGE_LEADS_KEY);
          if (localSaved) {
            const all = JSON.parse(localSaved);
            const filtered = all.filter(
              (l) =>
                (uEmail && l.email && l.email.toLowerCase() === uEmail.toLowerCase()) ||
                (uMob && l.mobile && l.mobile.includes(uMob)) ||
                (l.userId && (l.userId === uId || l.userId === userData.uid))
            );
            setUserAssessments(filtered);
          }
        } catch (e) {}
      }
    } finally {
      setLoadingAssessments(false);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
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

  const saveLeadSubmission = async (leadData, currentUser = null) => {
    const payload = {
      ...leadData,
      userId: currentUser?.id || leadData.userId || ""
    };
    const res = await submitReportApi(payload);
    const rawReport = res.report || {};

    const newLead = {
      id: rawReport._id || rawReport.id || "lead_" + Date.now(),
      userId: payload.userId,
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
      const updated = [newLead, ...prev.filter((item) => item.id !== newLead.id && item._id !== newLead.id)];
      try {
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setUserAssessments((prev) => {
      const updated = [newLead, ...prev.filter((item) => item.id !== newLead.id && item._id !== newLead.id)];
      try {
        localStorage.setItem(STORAGE_USER_ASSESSMENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveLead(newLead);
    addAuditLog("Report Generation", newLead.email, "Success", `Lead submitted: ${newLead.name}`);

    if (currentUser) {
      fetchUserAssessments(currentUser).catch(() => {});
    }

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
    setUserAssessments((prev) => {
      const updated = prev.filter((l) => l.id !== leadId && l._id !== leadId);
      try {
        localStorage.setItem(STORAGE_USER_ASSESSMENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (activeLead && (activeLead.id === leadId || activeLead._id === leadId)) {
      setActiveLead(null);
    }
    addAuditLog("Lead Management", "Admin", "Success", `Lead deleted: ${leadId}`);
  };

  const deleteUserAssessment = async (leadId) => {
    await deleteAssessmentApi(leadId);
    setUserAssessments((prev) => {
      const updated = prev.filter((l) => l.id !== leadId && l._id !== leadId);
      try {
        localStorage.setItem(STORAGE_USER_ASSESSMENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId && l._id !== leadId);
      try {
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        leads,
        activeLead,
        setActiveLead,
        userAssessments,
        fetchUserAssessments,
        loadingAssessments,
        deleteUserAssessment,
        contactEnquiries,
        saveContactEnquiry,
        deleteContactEnquiry,
        auditLogs,
        addAuditLog,
        saveLeadSubmission,
        deleteLead,
        refreshBackendData
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
