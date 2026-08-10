import React, { useState } from "react";
import { Mail, Search, Trash2, Eye, Calendar, User, MessageSquare, Tag, X, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function EnquiryTable() {
  const { contactEnquiries = [], deleteContactEnquiry } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const topicsList = [
    "All Topics",
    "Comprehensive Financial Planning",
    "Retirement & Pension Strategy",
    "Child Education & Marriage Funding",
    "Life & Health Protection Audit",
    "Investment & Portfolio Review",
    "General Enquiry / Other"
  ];

  // Filter enquiries
  const filteredEnquiries = contactEnquiries.filter((enq) => {
    const nameMatch = (enq.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (enq.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const msgMatch = (enq.message || "").toLowerCase().includes(searchTerm.toLowerCase());
    const searchPass = nameMatch || emailMatch || msgMatch;

    const topicPass = topicFilter === "all" || topicFilter === "All Topics" || enq.topic === topicFilter;

    return searchPass && topicPass;
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this advisory enquiry?")) {
      deleteContactEnquiry(id);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(null);
      }
    }
  };

  const getTopicColor = (topic) => {
    if ((topic || "").includes("Financial")) return { bg: "rgba(201, 154, 75, 0.15)", text: "#C99A4B", border: "rgba(201, 154, 75, 0.4)" };
    if ((topic || "").includes("Retirement")) return { bg: "rgba(95, 168, 160, 0.15)", text: "#5FA8A0", border: "rgba(95, 168, 160, 0.4)" };
    if ((topic || "").includes("Protection") || (topic || "").includes("Insurance")) return { bg: "rgba(244, 63, 94, 0.15)", text: "#F43F5E", border: "rgba(244, 63, 94, 0.4)" };
    if ((topic || "").includes("Investment")) return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981", border: "rgba(16, 185, 129, 0.4)" };
    return { bg: "rgba(129, 140, 248, 0.15)", text: "#818CF8", border: "rgba(129, 140, 248, 0.4)" };
  };

  return (
    <div style={{ textAling: "left" }}>
      {/* SEARCH AND FILTER BAR */}
      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={18} color="var(--text-fog)" style={{ position: "absolute", left: 16, top: 16 }} />
          <input
            type="text"
            className="ff-input-56px"
            placeholder="Search by name, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 46 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Tag size={16} color="var(--text-fog)" />
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            style={{
              height: 52,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              padding: "0 16px",
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            <option value="all" style={{ background: "#0B0D14", color: "#FFF" }}>All Topics ({contactEnquiries.length})</option>
            {topicsList.slice(1).map((t) => (
              <option key={t} value={t} style={{ background: "#0B0D14", color: "#FFF" }}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE DATA CONTAINER */}
      <div
        className="ff-card-glass"
        style={{
          borderRadius: 20,
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
          background: "var(--bg-surface)"
        }}
      >
        {filteredEnquiries.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <Mail size={40} color="var(--text-fog)" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <h3 style={{ fontSize: 18, color: "var(--text-main)", margin: "0 0 6px" }}>No Advisory Enquiries Found</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-fog)", margin: 0 }}>
              {contactEnquiries.length === 0
                ? "Submissions via the Contact / Advisory form will appear here in real-time."
                : "No enquiries match your search filter."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    borderBottom: "1px solid var(--border-subtle)",
                    color: "var(--text-fog)",
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <th style={{ padding: "16px 20px" }}>Date & Time</th>
                  <th style={{ padding: "16px 20px" }}>Client Name</th>
                  <th style={{ padding: "16px 20px" }}>Email Address</th>
                  <th style={{ padding: "16px 20px" }}>Enquiry Topic</th>
                  <th style={{ padding: "16px 20px" }}>Message Preview</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((enq) => {
                  const topicStyle = getTopicColor(enq.topic);
                  const dateStr = enq.submittedAt
                    ? new Date(enq.submittedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "Recent";

                  return (
                    <tr
                      key={enq.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.2s ease",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedEnquiry(enq)}
                      className="ff-table-row-hover"
                    >
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap", color: "var(--text-fog)", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={14} color="var(--accent-gold)" />
                          {dateStr}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "rgba(201, 154, 75, 0.15)",
                              border: "1px solid var(--border-gold)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--accent-gold)",
                              fontSize: 13,
                              fontWeight: 700
                            }}
                          >
                            {(enq.name || "U")[0].toUpperCase()}
                          </div>
                          {enq.name || "Advisory Client"}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", color: "var(--text-fog)", whiteSpace: "nowrap" }}>
                        <a
                          href={`mailto:${enq.email}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "var(--accent-teal)", textDecoration: "none" }}
                        >
                          {enq.email || "No email provided"}
                        </a>
                      </td>

                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: topicStyle.bg,
                            color: topicStyle.text,
                            border: `1px solid ${topicStyle.border}`
                          }}
                        >
                          {enq.topic || "General Enquiry"}
                        </span>
                      </td>

                      <td style={{ padding: "16px 20px", color: "var(--text-fog)", fontSize: 13, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {enq.message || "(No message written)"}
                      </td>

                      <td style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEnquiry(enq);
                            }}
                            title="View Message"
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-main)",
                              fontSize: 12.5,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Eye size={14} color="var(--accent-gold)" /> View
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(enq.id, e)}
                            title="Delete Enquiry"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#EF4444",
                              fontSize: 12.5,
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ENQUIRY DETAIL MODAL */}
      {selectedEnquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 6, 10, 0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="ff-card-glass"
            style={{
              maxWidth: 580,
              width: "100%",
              borderRadius: 24,
              border: "1px solid var(--border-gold)",
              background: "linear-gradient(135deg, rgba(20, 24, 38, 0.99) 0%, rgba(11, 13, 20, 0.99) 100%)",
              padding: 32,
              textAlign: "left",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div className="ff-badge ff-badge-gold" style={{ fontSize: 11, padding: "4px 10px", marginBottom: 8 }}>
                  Advisory Enquiry Details
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", margin: 0, fontFamily: "var(--font-serif)" }}>
                  {selectedEnquiry.name || "Client Enquiry"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  color: "var(--text-fog)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* DETAILS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20, fontSize: 13.5 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", marginBottom: 4 }}>Email Address</div>
                <a href={`mailto:${selectedEnquiry.email}`} style={{ color: "var(--accent-teal)", fontWeight: 600, textDecoration: "none" }}>
                  {selectedEnquiry.email || "No email"}
                </a>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", marginBottom: 4 }}>Submission Date</div>
                <div style={{ color: "var(--text-main)", fontWeight: 600 }}>
                  {selectedEnquiry.submittedAt
                    ? new Date(selectedEnquiry.submittedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })
                    : "Recent"}
                </div>
              </div>
            </div>

            {/* TOPIC BADGE */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", marginBottom: 6 }}>Selected Advisory Topic</div>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: getTopicColor(selectedEnquiry.topic).bg,
                  color: getTopicColor(selectedEnquiry.topic).text,
                  border: `1px solid ${getTopicColor(selectedEnquiry.topic).border}`
                }}
              >
                {selectedEnquiry.topic || "General Enquiry"}
              </span>
            </div>

            {/* MESSAGE BOX */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "var(--text-fog)", textTransform: "uppercase", marginBottom: 6 }}>Client Message</div>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 14,
                  padding: 16,
                  color: "var(--text-main)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  minHeight: 100,
                  whiteSpace: "pre-wrap"
                }}
              >
                {selectedEnquiry.message || "No specific message provided by client."}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={(e) => handleDelete(selectedEnquiry.id, e)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Trash2 size={16} /> Delete Enquiry
              </button>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="ff-btn-gold"
                style={{ height: 44, padding: "0 24px", borderRadius: 12, fontSize: 14 }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
