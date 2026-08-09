import React from "react";

export default function StepBasics({ data, onChange, onNext }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onNext) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: 0 }}>
          Let's start with your profile.
        </h2>
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Full Name</label>
        <input
          type="text"
          className="ff-input-56px"
          placeholder="Enter your full name"
          value={data.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Email Address</label>
        <input
          type="email"
          className="ff-input-56px"
          placeholder="Enter your email address"
          value={data.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div className="ff-input-group">
        <label className="ff-input-label-uppercase">Mobile Number</label>
        <input
          type="tel"
          className="ff-input-56px"
          placeholder="Enter 10-digit mobile number"
          value={data.mobile || ""}
          onChange={(e) => onChange("mobile", e.target.value)}
        />
      </div>
    </div>
  );
}
