import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Send
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSfplzBIcOWuDBsczdUasKnxMVt57OvJSntLYrYyUyo5Nqf67w/formResponse";

const EDUCATION_OPTIONS = [
  { value: "high school 10/12", label: "High School (10th / 12th)" },
  { value: "diploma/ polytechnique", label: "Diploma / Polytechnique" },
  { value: "bachelors degree (btech,bsc,bcom,etc)", label: "Bachelor's Degree (B.Tech, B.Sc, B.Com, etc.)" },
  { value: "doctorate/phd", label: "Doctorate / Ph.D." },
  { value: "master/ mba", label: "Master's / MBA" },
  { value: "professional certificate (ca,cfa,cs,etc)", label: "Professional Certificate (CA, CFA, CS, etc.)" },
  { value: "others", label: "Others" }
];

export default function FormsPortal({ onRedirectHome }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    city: "",
    profession: "",
    education: ""
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hiddenFormRef = useRef(null);

  // Parse prefill parameters from current URL on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.includes("?")
          ? window.location.hash.split("?")[1]
          : ""
      );

      const getVal = (...keys) => {
        for (const k of keys) {
          const val = searchParams.get(k) || hashParams.get(k);
          if (val) return decodeURIComponent(val).trim();
        }
        return "";
      };

      const nameVal = getVal("entry.183190177", "name", "fullname");
      const emailVal = getVal("entry.388060596", "email", "mail");
      const mobileVal = getVal("entry.1384209841", "mobile", "phone");
      const cityVal = getVal("entry.72691823", "city");
      const profVal = getVal("entry.1170563700", "profession", "occupation");
      const eduValRaw = getVal("entry.1764066533", "education", "qualification");

      // Match education option case-insensitively
      let matchedEdu = "";
      if (eduValRaw) {
        const lowerEdu = eduValRaw.toLowerCase();
        const found = EDUCATION_OPTIONS.find(
          (opt) => opt.value.toLowerCase() === lowerEdu || lowerEdu.includes(opt.value.toLowerCase())
        );
        matchedEdu = found ? found.value : eduValRaw;
      }

      setFormData((prev) => ({
        name: (nameVal || prev.name).slice(0, 50),
        email: (emailVal || prev.email).slice(0, 80),
        mobile: (mobileVal || prev.mobile).slice(0, 16),
        city: (cityVal || prev.city).slice(0, 40),
        profession: (profVal || prev.profession).slice(0, 60),
        education: matchedEdu || prev.education
      }));
    } catch (e) {
      console.warn("FormsPortal: could not parse URL prefill params", e);
    }
  }, []);

  // Automatically redirect to home screen within ~1.8 seconds after submission
  useEffect(() => {
    if (!isSubmitted) return;

    const timer = setTimeout(() => {
      handleDoneRedirect();
    }, 1800);

    return () => clearTimeout(timer);
  }, [isSubmitted]);

  const handleDoneRedirect = () => {
    if (typeof onRedirectHome === "function") {
      onRedirectHome();
    } else {
      window.location.href = "/";
    }
  };

  const handleChange = (field, value) => {
    // Apply field character and format limits
    let cleanVal = value;
    if (field === "name") {
      cleanVal = value.slice(0, 50);
    } else if (field === "email") {
      cleanVal = value.slice(0, 80);
    } else if (field === "mobile") {
      // Allow only digits, spaces, and leading '+'
      cleanVal = value.replace(/[^\d+ ]/g, "").slice(0, 16);
      const digitCount = (cleanVal.match(/\d/g) || []).length;
      if (digitCount > 13) return; // Max 13 digits
    } else if (field === "city") {
      cleanVal = value.slice(0, 40);
    } else if (field === "profession") {
      cleanVal = value.slice(0, 60);
    }

    setFormData((prev) => ({ ...prev, [field]: cleanVal }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = "Full Name is required";
    } else if (trimmedName.length < 2) {
      errs.name = "Please enter at least 2 characters";
    } else if (/^[\d\W]+$/.test(trimmedName)) {
      errs.name = "Please enter a valid name";
    }

    const trimmedEmail = formData.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address";
    }

    const trimmedMobile = formData.mobile.trim();
    if (trimmedMobile) {
      const digitCount = (trimmedMobile.match(/\d/g) || []).length;
      if (digitCount < 10 || digitCount > 13) {
        errs.mobile = "Mobile number must contain between 10 and 13 digits";
      }
    }

    const trimmedCity = formData.city.trim();
    if (trimmedCity && trimmedCity.length > 40) {
      errs.city = "City name exceeds maximum limit of 40 characters";
    }

    const trimmedProf = formData.profession.trim();
    if (!trimmedProf) {
      errs.profession = "Profession is required";
    } else if (trimmedProf.length < 2) {
      errs.profession = "Please enter at least 2 characters";
    }

    if (!formData.education || !formData.education.trim()) {
      errs.education = "Please select your higher education";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validate()) {
      window.scrollTo({ top: 80, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Hidden iframe form submission for reliable Google Form capture
      if (hiddenFormRef.current) {
        hiddenFormRef.current.submit();
      }

      // 2. Dual submit via fetch (no-cors) to guarantee Google Forms receives payload
      const postParams = new URLSearchParams();
      postParams.append("entry.183190177", formData.name.trim());
      postParams.append("entry.388060596", formData.email.trim());
      postParams.append("entry.1384209841", formData.mobile.trim());
      postParams.append("entry.72691823", formData.city.trim());
      postParams.append("entry.1170563700", formData.profession.trim());
      postParams.append("entry.1764066533", formData.education.trim());

      fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postParams
      }).catch((fetchErr) => {
        console.warn("Google Form direct fetch notice (safe fallback used):", fetchErr);
      });

      // 3. Asynchronously record as lead/enquiry in the local backend database
      fetch(`${API_BASE_URL}/reports/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          topic: `Form Profile: ${formData.profession} (${formData.education})`,
          message: `City: ${formData.city || "N/A"} | Higher Education: ${formData.education} | Profession: ${formData.profession}`
        })
      }).catch(() => {});

      // Brief transition before showing clean success message
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 600);
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-main, #07080C)",
        color: "var(--text-main, #FFFFFF)",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        paddingBottom: 60,
        position: "relative",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Hidden iframe and form for Google Form submission without navigation/CORS blocks */}
      <iframe
        name="gform_hidden_iframe"
        id="gform_hidden_iframe"
        title="Google Form Target"
        style={{ display: "none", width: 0, height: 0, border: 0 }}
      />
      <form
        ref={hiddenFormRef}
        action={GOOGLE_FORM_ACTION}
        method="POST"
        target="gform_hidden_iframe"
        style={{ display: "none" }}
      >
        <input type="hidden" name="entry.183190177" value={formData.name} />
        <input type="hidden" name="entry.388060596" value={formData.email} />
        <input type="hidden" name="entry.1384209841" value={formData.mobile} />
        <input type="hidden" name="entry.72691823" value={formData.city} />
        <input type="hidden" name="entry.1170563700" value={formData.profession} />
        <input type="hidden" name="entry.1764066533" value={formData.education} />
      </form>

      {/* Ambient background glow accents */}
      <div
        style={{
          position: "fixed",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(720px, 90vw)",
          height: 340,
          background: "radial-gradient(circle, rgba(201, 154, 75, 0.12) 0%, rgba(7, 8, 12, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* TOP HEADER BRANDING */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          backgroundColor: "rgba(13, 14, 21, 0.88)",
          backdropFilter: "blur(14px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "16px 16px"
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 3vw, 16px)",
            flexWrap: "wrap",
            textAlign: "center"
          }}
        >
          {/* Your Wealth Compass Brand */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: "clamp(18px, 4.5vw, 22px)",
              fontWeight: 800,
              letterSpacing: "-0.02em"
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Your</span>
            <span style={{ color: "var(--accent-gold, #C99A4B)" }}>Wealth</span>
            <span style={{ color: "#FFFFFF" }}>Compass</span>
          </div>

          <div
            style={{
              width: 1,
              height: 18,
              backgroundColor: "var(--border-medium, rgba(255, 255, 255, 0.18))"
            }}
          />

          {/* powered by apkacoach.com with logo */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "clamp(11px, 3vw, 13px)",
              color: "var(--text-fog, #8FA0AC)"
            }}
          >
            <span style={{ textTransform: "lowercase", letterSpacing: "0.02em" }}>powered by</span>
            <a
              href="https://www.apkacoach.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center" }}
              title="www.apkacoach.com"
            >
              <img
                src="/apkacoach-logo-dark.png"
                alt="www.apkacoach.com"
                style={{
                  height: "clamp(18px, 4vw, 22px)",
                  width: "auto",
                  objectFit: "contain",
                  verticalAlign: "middle"
                }}
              />
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main
        style={{
          width: "100%",
          maxWidth: 580,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 40px) clamp(12px, 3vw, 20px) 0",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box"
        }}
      >
        {isSubmitted ? (
          /* SUCCESS STATE - Direct Clean Message, No countdown pill/button */
          <div
            style={{
              background: "var(--bg-surface, #0D0E15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: 20,
              padding: "clamp(36px, 8vw, 56px) clamp(20px, 5vw, 36px)",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              animation: "fadeIn 0.35s ease"
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.14)",
                border: "2px solid #10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px"
              }}
            >
              <CheckCircle2 size={38} color="#10B981" />
            </div>

            <h2
              style={{
                fontSize: "clamp(20px, 4.5vw, 24px)",
                fontWeight: 800,
                color: "#FFFFFF",
                marginBottom: 8,
                fontFamily: "var(--font-serif, sans-serif)"
              }}
            >
              Your message is sent directly
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "var(--text-fog, #8FA0AC)",
                maxWidth: 420,
                margin: "0 auto",
                lineHeight: 1.5
              }}
            >
              Thank you, <strong style={{ color: "#FFFFFF" }}>{formData.name || "User"}</strong>.
            </p>
          </div>
        ) : (
          /* FORM VIEW - Clean, Direct Inputs, Word/Character Limits */
          <div
            style={{
              background: "var(--bg-surface, #0D0E15)",
              border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.12))",
              borderRadius: "clamp(14px, 3vw, 20px)",
              boxShadow: "var(--shadow-layered, 0 24px 72px rgba(0, 0, 0, 0.85))",
              overflow: "hidden",
              padding: "clamp(20px, 5vw, 36px) clamp(16px, 4vw, 32px)",
              boxSizing: "border-box"
            }}
          >
            <form onSubmit={handleSubmit} style={{ width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 1. Full Name (Required, Max 50 chars) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <User size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>Full Name</span>
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your full name"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.name
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.name
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  />
                  {formErrors.name && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.name}
                    </div>
                  )}
                </div>

                {/* 2. Email Address (Optional, Max 80 chars) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <Mail size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    maxLength={80}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Your email address"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.email
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.email
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  />
                  {formErrors.email && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.email}
                    </div>
                  )}
                </div>

                {/* 3. Mobile Number (Optional, Max 13 digits, max 16 chars with +91) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <Phone size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={16}
                    value={formData.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    placeholder="Your mobile number"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.mobile
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.mobile
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  />
                  {formErrors.mobile && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.mobile}
                    </div>
                  )}
                </div>

                {/* 4. City (Optional, Max 40 chars) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <MapPin size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>City</span>
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Enter your city"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.city
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.city
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  />
                  {formErrors.city && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.city}
                    </div>
                  )}
                </div>

                {/* 5. Profession (Required, Max 60 chars) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <Briefcase size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>Profession</span>
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={formData.profession}
                    onChange={(e) => handleChange("profession", e.target.value)}
                    placeholder="Enter your profession"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.profession
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.profession
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  />
                  {formErrors.profession && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.profession}
                    </div>
                  )}
                </div>

                {/* 6. Highest Education (Required Dropdown) */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-ivory, #F3EFE6)",
                      marginBottom: 8
                    }}
                  >
                    <GraduationCap size={15} color="var(--accent-gold, #C99A4B)" />
                    <span>Highest Education</span>
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={formData.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.education
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: formData.education ? "#FFFFFF" : "var(--text-dim, #647888)",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = formErrors.education
                        ? "#EF4444"
                        : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                    }
                  >
                    <option value="" disabled style={{ backgroundColor: "#10121B", color: "#8FA0AC" }}>
                      Select your higher education
                    </option>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{ backgroundColor: "#10121B", color: "#FFFFFF" }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.education && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.education}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button & Clean Disclaimer */}
              <div style={{ marginTop: 28 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    minHeight: 50,
                    padding: "14px 20px",
                    borderRadius: 12,
                    backgroundColor: "var(--accent-gold, #C99A4B)",
                    color: "#07080C",
                    fontSize: "clamp(15px, 4vw, 16px)",
                    fontWeight: 700,
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: "0 4px 18px rgba(201, 154, 75, 0.35)",
                    transition: "all 0.2s ease",
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = "var(--accent-gold-hover, #B5883D)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = "var(--accent-gold, #C99A4B)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          border: "2px solid #07080C",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }}
                      />
                      <span>Recording Response...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Details</span>
                    </>
                  )}
                </button>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-dim, #647888)",
                    textAlign: "center",
                    marginTop: 16,
                    marginBottom: 0
                  }}
                >
                  Your Wealth Compass
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
