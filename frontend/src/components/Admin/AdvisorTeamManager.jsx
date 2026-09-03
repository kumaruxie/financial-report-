import React, { useState } from "react";
import {
  Users, UserPlus, KeyRound, Shield, ShieldCheck, UserCheck, UserX,
  Trash2, Mail, Phone, RefreshCw, CheckCircle2, AlertCircle, Sparkles, X, Eye, EyeOff, Lock
} from "lucide-react";
import {
  createAdminTeamUserApi,
  resetAdminTeamUserPasswordApi,
  updateAdminTeamUserStatusApi,
  deleteAdminTeamUserApi
} from "../../services/api";

export default function AdvisorTeamManager({
  teamUsers = [],
  adminToken = "",
  onRefresh = () => {},
  currentAdminRole = "superadmin"
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("advisor");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Reset Password State
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Action status message
  const [actionMsg, setActionMsg] = useState("");

  const totalAdvisors = teamUsers.length;
  const activeAdvisors = teamUsers.filter((u) => u.status !== "inactive").length;
  const totalAssignedLeads = teamUsers.reduce((sum, u) => sum + (u.assignedLeadsCount || 0), 0);
  const totalConvertedLeads = teamUsers.reduce((sum, u) => sum + (u.convertedLeadsCount || 0), 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    const trimmedId = newEmail.trim().toLowerCase();
    if (!newName.trim() || !trimmedId || !newPassword.trim()) {
      setCreateError("Name, User ID, and password are required.");
      return;
    }

    // Check if User ID already exists in teamUsers
    const exists = teamUsers.some((u) => (u.email || "").toLowerCase() === trimmedId || (u.id || "").toLowerCase() === trimmedId);
    if (exists) {
      setCreateError(`User ID "${trimmedId}" already exists in the database. Please choose a different User ID.`);
      return;
    }

    if (newPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createAdminTeamUserApi(
        {
          name: newName.trim(),
          email: trimmedId,
          mobile: newMobile.trim(),
          password: newPassword,
          role: newRole
        },
        adminToken
      );

      if (res && res.success) {
        setCreateSuccess(`✓ Advisor account created for ${newName}!`);
        setNewName("");
        setNewEmail("");
        setNewMobile("");
        setNewPassword("");
        onRefresh();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateSuccess("");
        }, 1500);
      } else {
        setCreateError(res?.error || "Failed to create advisor.");
      }
    } catch (err) {
      setCreateError("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetAdminTeamUserPasswordApi(selectedUserForReset.id, resetPasswordVal, adminToken);
      if (res && res.success) {
        setResetSuccess(`✓ Password successfully updated for ${selectedUserForReset.name}!`);
        setResetPasswordVal("");
        onRefresh();
        setTimeout(() => {
          setIsResetModalOpen(false);
          setSelectedUserForReset(null);
          setResetSuccess("");
        }, 1500);
      } else {
        setResetError(res?.error || "Failed to reset password.");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "inactive" ? "active" : "inactive";
    try {
      const res = await updateAdminTeamUserStatusApi(user.id, nextStatus, adminToken);
      if (res && res.success) {
        setActionMsg(`User status updated to ${nextStatus}.`);
        onRefresh();
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete advisor '${user.name}'? Any assigned leads will become unassigned.`)) {
      return;
    }
    try {
      const res = await deleteAdminTeamUserApi(user.id, adminToken);
      if (res && res.success) {
        setActionMsg(`Advisor ${user.name} removed.`);
        onRefresh();
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. TOP METRICS & HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: 0, fontFamily: "var(--font-serif)" }}>
            Advisor Team & Role Management
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-fog)", margin: "4px 0 0" }}>
            Create advisor credentials, manage assigned lead distribution, and monitor individual conversion rates.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError("");
            setCreateSuccess("");
            setIsCreateModalOpen(true);
          }}
          className="ff-btn-primary"
          style={{
            height: 44,
            padding: "0 22px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "linear-gradient(135deg, var(--accent-gold) 0%, #A87930 100%)",
            color: "#07080C",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 6px 20px rgba(201, 154, 75, 0.25)",
            cursor: "pointer"
          }}
        >
          <UserPlus size={16} /> Create New Advisor
        </button>
      </div>

      {actionMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34D399", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      {/* 2. STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="ff-card-glass" style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-fog)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            Total Advisors
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
            {totalAdvisors} <span style={{ fontSize: 13, color: "var(--accent-teal)", fontWeight: 600 }}>({activeAdvisors} Active)</span>
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-fog)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            Total Leads Assigned
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
            {totalAssignedLeads}
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-fog)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            Total Converted Clients
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
            {totalConvertedLeads}
          </div>
        </div>

        <div className="ff-card-glass" style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-fog)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            Team Conversion Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--font-mono)" }}>
            {totalAssignedLeads > 0 ? Math.round((totalConvertedLeads / totalAssignedLeads) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 3. ADVISOR ROSTER TABLE */}
      <div className="ff-card-glass" style={{ borderRadius: 18, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={17} color="var(--accent-gold)" /> Advisor Roster ({teamUsers.length})
          </div>
          <button onClick={onRefresh} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="ff-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
          <table className="ff-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-fog)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "12px 16px" }}>Advisor / Member</th>
                <th style={{ padding: "12px 12px" }}>Role</th>
                <th style={{ padding: "12px 12px" }}>Status</th>
                <th style={{ padding: "12px 12px", textAlign: "center" }}>Assigned Leads</th>
                <th style={{ padding: "12px 12px", textAlign: "center" }}>In Progress</th>
                <th style={{ padding: "12px 12px", textAlign: "center" }}>Converted</th>
                <th style={{ padding: "12px 12px", textAlign: "center" }}>Conv. Rate</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-fog)" }}>
                    No advisors created yet. Click <b>"Create New Advisor"</b> to add your first team member.
                  </td>
                </tr>
              ) : (
                teamUsers.map((u) => {
                  const isInactive = u.status === "inactive";
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                        opacity: isInactive ? 0.6 : 1
                      }}
                    >
                      {/* Name & Contact */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: u.role === "superadmin" ? "rgba(201, 154, 75, 0.2)" : "rgba(95, 168, 160, 0.2)",
                              color: u.role === "superadmin" ? "var(--accent-gold)" : "var(--accent-teal)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 14
                            }}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div style={{ minWidth: 0, maxWidth: 150 }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.name}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-fog)", display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.email}>
                              <UserCheck size={11} /> {u.email}
                              {u.mobile && (
                                <>
                                  <span>&bull;</span>
                                  <Phone size={11} /> {u.mobile}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        {u.role === "superadmin" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(201, 154, 75, 0.15)", color: "var(--accent-gold)", border: "1px solid var(--border-gold)", whiteSpace: "nowrap", display: "inline-block" }}>
                            👑 Super Admin
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(95, 168, 160, 0.15)", color: "var(--accent-teal)", border: "1px solid rgba(95, 168, 160, 0.3)", whiteSpace: "nowrap", display: "inline-block" }}>
                            💼 Advisor
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            padding: 0
                          }}
                          title="Click to toggle active/inactive status"
                        >
                          {isInactive ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(239, 68, 68, 0.15)", color: "#F87171", border: "1px solid rgba(239, 68, 68, 0.3)", whiteSpace: "nowrap", display: "inline-block" }}>
                              ● Inactive
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.3)", whiteSpace: "nowrap", display: "inline-block" }}>
                              ● Active
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Assigned Leads */}
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
                        {u.assignedLeadsCount || 0}
                      </td>

                      {/* In Progress */}
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
                        {u.inProgressLeadsCount || 0}
                      </td>

                      {/* Converted */}
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
                        {u.convertedLeadsCount || 0}
                      </td>

                      {/* Conversion Rate */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: (u.conversionRate || 0) > 30 ? "var(--accent-emerald)" : "var(--text-fog)" }}>
                          {u.conversionRate || 0}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => {
                              setSelectedUserForReset(u);
                              setResetPasswordVal("");
                              setResetError("");
                              setResetSuccess("");
                              setIsResetModalOpen(true);
                            }}
                            className="ff-btn-ghost"
                            style={{ height: 32, padding: "0 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--border-subtle)", color: "var(--accent-gold)" }}
                            title="Reset password"
                          >
                            <KeyRound size={13} /> Reset Pass
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="ff-btn-ghost"
                            style={{ height: 32, padding: "0 8px", fontSize: 12, borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.2)", color: "#F87171" }}
                            title="Delete Advisor"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: CREATE NEW ADVISOR */}
      {isCreateModalOpen && (
        <div className="ff-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(5, 6, 10, 0.88)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="ff-modal-card" style={{ width: "100%", maxWidth: 520, background: "#0D0E15", border: "1px solid var(--border-gold)", borderRadius: 20, padding: "28px 32px", color: "var(--text-main)", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "var(--font-serif)" }}>
                  Create New Advisor Account
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {createSuccess ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#34D399" }}>
                <CheckCircle2 size={40} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 16, fontWeight: 700 }}>{createSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {createError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                    {createError}
                  </div>
                )}

                <div className="ff-form-group" style={{ margin: 0 }}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="ff-input"
                    placeholder="Enter advisor full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="ff-form-group" style={{ margin: 0 }}>
                  <label>User ID / Username *</label>
                  <input
                    type="text"
                    className="ff-input"
                    placeholder="Enter user ID (e.g. kumar123)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value.toLowerCase().trim())}
                    required
                  />
                  <div style={{ fontSize: 11, color: "var(--text-fog)", marginTop: 4 }}>
                    Custom User ID assigned to this advisor for signing in (e.g. kumar123).
                  </div>
                </div>

                <div className="ff-form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, color: "var(--text-soft)", display: "block", marginBottom: 6 }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    className="ff-input"
                    placeholder="Enter contact number"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                  />
                </div>

                <div className="ff-form-group" style={{ margin: 0 }}>
                  <label>Role</label>
                  <select
                    className="ff-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="advisor">💼 Advisor (Assigned Leads Only)</option>
                    <option value="superadmin">👑 Super Admin (Full Platform Access)</option>
                  </select>
                </div>

                <div className="ff-form-group" style={{ margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ margin: 0 }}>Set Login Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      style={{ background: "none", border: "none", color: "var(--accent-gold)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Sparkles size={12} /> Auto Generate
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="ff-input"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: 40 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer" }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="ff-btn-ghost"
                    style={{ height: 44, padding: "0 20px", borderRadius: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="ff-btn-primary"
                    style={{ height: 44, padding: "0 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--accent-gold)", color: "#07080C" }}
                  >
                    {isCreating ? "Creating..." : "Save Advisor"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: RESET PASSWORD */}
      {isResetModalOpen && selectedUserForReset && (
        <div className="ff-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(5, 6, 10, 0.88)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="ff-modal-card" style={{ width: "100%", maxWidth: 460, background: "#0D0E15", border: "1px solid var(--border-gold)", borderRadius: 20, padding: "28px 32px", color: "var(--text-main)", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Reset Password for {selectedUserForReset.name}
                </h3>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-fog)", margin: "0 0 16px" }}>
              Enter a new secure password for <b>{selectedUserForReset.email}</b>.
            </p>

            {resetSuccess ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#34D399" }}>
                <CheckCircle2 size={36} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>{resetSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {resetError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                    {resetError}
                  </div>
                )}

                <div className="ff-form-group" style={{ margin: 0 }}>
                  <label>New Password (Min 6 characters)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showResetPassword ? "text" : "password"}
                      className="ff-input"
                      placeholder="Enter new password"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      style={{ paddingRight: 40 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-fog)", cursor: "pointer" }}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="ff-btn-ghost"
                    style={{ height: 42, padding: "0 18px", borderRadius: 10 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="ff-btn-primary"
                    style={{ height: 42, padding: "0 22px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "var(--accent-gold)", color: "#07080C" }}
                  >
                    {isResetting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
