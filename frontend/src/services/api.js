const API_BASE_URL = "http://localhost:5000/api/v1";

export async function requestOtpApi(identifier) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier })
    });
    return await res.json();
  } catch (err) {
    console.warn("Backend API requestOtp failed, fallback to local:", err.message);
    return { success: true, message: "Fallback local OTP" };
  }
}

export async function verifyOtpApi(identifier, otp, name) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, otp, name })
    });
    return await res.json();
  } catch (err) {
    console.warn("Backend API verifyOtp failed, fallback to local:", err.message);
    return {
      success: true,
      token: "mock_jwt_token_" + Date.now(),
      user: { id: "usr_local", name: name || "Client User", email: identifier, role: "client" }
    };
  }
}

export async function submitReportApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.warn("Backend API submitReport failed, fallback to local:", err.message);
    return {
      success: true,
      report: { id: "lead_" + Date.now(), submittedAt: new Date().toISOString(), ...payload },
      pdfUrl: null
    };
  }
}

export async function getLeadsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/leads`);
    const data = await res.json();
    return data.leads || [];
  } catch (err) {
    console.warn("Backend API getLeads failed:", err.message);
    return null;
  }
}

export async function getAuditLogsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/logs`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn("Backend API getAuditLogs failed:", err.message);
    return null;
  }
}

export function getPdfDownloadUrl(reportId) {
  return `${API_BASE_URL}/reports/${reportId}/pdf`;
}
