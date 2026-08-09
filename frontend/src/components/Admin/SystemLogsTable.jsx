import React, { useState } from "react";
import { Shield, Filter, Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function SystemLogsTable() {
  const { auditLogs } = useApp();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const eventTypes = Array.from(new Set(auditLogs.map((l) => l.type)));

  const filteredLogs = auditLogs.filter((log) => {
    const textMatch =
      (log.user || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!textMatch) return false;
    if (filterType !== "all" && log.type !== filterType) return false;
    return true;
  });

  return (
    <div className="ff-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, color: "var(--navy-900)", display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} color="var(--gold-400)" /> System Audit & Security Logs
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Inspect passwordless OTP events, PDF compilation logs, and user sessions.</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 200 }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: 10 }} />
            <input
              type="text"
              className="ff-input"
              style={{ paddingLeft: 30, padding: "7px 12px 7px 30px", fontSize: 13 }}
              placeholder="Search user or log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="ff-input"
            style={{ padding: "7px 12px", fontSize: 13, width: "auto" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Event Types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="ff-table-wrapper">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Category</th>
              <th>User Identifier</th>
              <th>Status</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                  No system logs matched your search.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--navy-600)" }}>
                    {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td>
                    <span className="ff-badge ff-badge-info" style={{ fontSize: 11 }}>
                      {log.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13, color: "var(--navy-900)" }}>{log.user}</td>
                  <td>
                    <span className={`ff-badge ${log.status === "Success" ? "ff-badge-ok" : "ff-badge-gap"}`}>
                      {log.status === "Success" ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {log.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--navy-700)" }}>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
