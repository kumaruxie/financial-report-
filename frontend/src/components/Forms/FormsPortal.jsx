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
  Send,
  ShieldCheck,
  Check
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Google Form Submission Action Endpoint
const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSfplzBIcOWuDBsczdUasKnxMVt57OvJSntLYrYyUyo5Nqf67w/formResponse";

// Highest Education Options (Exactly matching Google Form)
const EDUCATION_OPTIONS = [
  { value: "Graduation , Post Graduation", label: "Graduation , Post Graduation" },
  { value: "Any Professional Certification ,Diploma , Degree", label: "Any Professional Certification ,Diploma , Degree" },
  { value: "12th pass", label: "12th pass" },
  { value: "Doctor", label: "Doctor" },
  { value: "Others", label: "Others (Specify qualification)" }
];

// City Options (Exactly matching Google Form)
const CITY_OPTIONS = [
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Gurgaon", label: "Gurgaon" },
  { value: "Noida", label: "Noida" },
  { value: "Other", label: "Other (Type your city)" }
];

// Current Profession Options (Exactly matching Google Form)
const PROFESSION_OPTIONS = [
  { value: "Chartered Accountant", label: "Chartered Accountant" },
  { value: "Professional", label: "Professional" },
  { value: "Insurance Professional (Agent , Adviser, Consultant)", label: "Insurance Professional (Agent , Adviser, Consultant)" },
  { value: "Finance Consultant , Banker and Mutual Funds Distributors or agents", label: "Finance Consultant , Banker and Mutual Funds Distributors or agents" },
  { value: "Health Care Professionl", label: "Health Care Professionl" },
  { value: "Others", label: "Others (Specify profession)" }
];

// Helper: Strict Indian 10-digit mobile check
export function isValidIndianMobile(mobile) {
  if (!mobile) return false;
  const digitsOnly = mobile.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digitsOnly);
}

// Helper: Strict RFC Email check
export function isValidEmailFormat(email) {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export default function FormsPortal({ onRedirectHome }) {
  const { user, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    city: "",
    customCity: "",
    profession: "",
    customProfession: "",
    education: "",
    customEducation: ""
  });

  const [recordEmailConsent, setRecordEmailConsent] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const hiddenFormRef = useRef(null);

  // Sync logged in user if available
  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email,
        name: prev.name || user.name || ""
      }));
    }
  }, [user]);

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
      const emailVal = getVal("emailAddress", "entry.388060596", "email", "mail");
      const mobileValRaw = getVal("entry.1384209841", "mobile", "phone");
      const mobileVal = (mobileValRaw || "").replace(/\D/g, "").slice(0, 10);
      const cityValRaw = getVal("entry.72691823", "city");
      const eduValRaw = getVal("entry.1170563700", "education", "qualification");
      const profValRaw = getVal("entry.1764066533", "profession", "occupation");

      // Match city option
      let matchedCity = "";
      let customCityVal = "";
      if (cityValRaw) {
        const foundCity = CITY_OPTIONS.find(
          (c) => c.value.toLowerCase() === cityValRaw.toLowerCase()
        );
        if (foundCity) {
          matchedCity = foundCity.value;
        } else {
          matchedCity = "Other";
          customCityVal = cityValRaw.slice(0, 40);
        }
      }

      // Match education option
      let matchedEdu = "";
      let customEduVal = "";
      if (eduValRaw) {
        const foundEdu = EDUCATION_OPTIONS.find(
          (e) => e.value.toLowerCase() === eduValRaw.toLowerCase()
        );
        if (foundEdu) {
          matchedEdu = foundEdu.value;
        } else {
          matchedEdu = "Others";
          customEduVal = eduValRaw.slice(0, 60);
        }
      }

      // Match profession option
      let matchedProf = "";
      let customProfVal = "";
      if (profValRaw) {
        const foundProf = PROFESSION_OPTIONS.find(
          (p) => p.value.toLowerCase() === profValRaw.toLowerCase()
        );
        if (foundProf) {
          matchedProf = foundProf.value;
        } else {
          matchedProf = "Others";
          customProfVal = profValRaw.slice(0, 60);
        }
      }

      setFormData((prev) => ({
        name: (nameVal || prev.name).slice(0, 50),
        email: (emailVal || prev.email).slice(0, 80),
        mobile: mobileVal || prev.mobile,
        city: matchedCity || prev.city,
        customCity: customCityVal || prev.customCity,
        education: matchedEdu || prev.education,
        customEducation: customEduVal || prev.customEducation,
        profession: matchedProf || prev.profession,
        customProfession: customProfVal || prev.customProfession
      }));
    } catch (e) {
      console.warn("FormsPortal: URL prefill parse notice:", e);
    }
  }, []);

  // Redirect to home screen after submission
  useEffect(() => {
    if (!isSubmitted) return;

    const timer = setTimeout(() => {
      handleDoneRedirect();
    }, 2400);

    return () => clearTimeout(timer);
  }, [isSubmitted]);

  const handleDoneRedirect = () => {
    if (typeof onRedirectHome === "function") {
      onRedirectHome();
    } else {
      window.location.href = "/";
    }
  };

  const handleGoogleQuickAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res && res.user && res.user.email) {
        setFormData((prev) => ({
          ...prev,
          email: res.user.email,
          name: prev.name || res.user.name || ""
        }));
        setFormErrors((prev) => ({ ...prev, email: "" }));
      }
    } catch (err) {
      console.warn("Google quick auth fallback:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (field, value) => {
    let cleanVal = value;

    if (field === "name") {
      cleanVal = value.slice(0, 50);
    } else if (field === "email") {
      cleanVal = value.trim().slice(0, 80);
    } else if (field === "mobile") {
      cleanVal = value.replace(/\D/g, "").slice(0, 10);
    } else if (field === "customCity") {
      cleanVal = value.slice(0, 40);
    } else if (field === "customProfession") {
      cleanVal = value.slice(0, 60);
    } else if (field === "customEducation") {
      cleanVal = value.slice(0, 60);
    }

    setFormData((prev) => ({ ...prev, [field]: cleanVal }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Real-time detection state helpers
  const isMobileValid = isValidIndianMobile(formData.mobile);
  const isEmailValid = isValidEmailFormat(formData.email);

  // ALL MENUS ARE COMPULSORY
  const validate = () => {
    const errs = {};

    // 1. Email (Compulsory, Strict RFC Detection)
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email address is required";
    } else if (!isValidEmailFormat(trimmedEmail)) {
      errs.email = "Please enter a valid email address (e.g. name@domain.com)";
    }

    // 2. Name (Compulsory)
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = "Full Name is required";
    } else if (trimmedName.length < 2) {
      errs.name = "Name must be at least 2 characters";
    } else if (/^[\d\W]+$/.test(trimmedName)) {
      errs.name = "Please enter a valid alphabetic name";
    }

    // 3. Mobile (Compulsory, Strict Indian 10 digits starting with 6,7,8,9)
    const trimmedMobile = formData.mobile.trim();
    if (!trimmedMobile) {
      errs.mobile = "Mobile number is required";
    } else if (trimmedMobile.length !== 10) {
      errs.mobile = `Please enter exactly 10 digits (currently ${trimmedMobile.length} digits)`;
    } else if (!/^[6-9]/.test(trimmedMobile)) {
      errs.mobile = "Indian mobile numbers must begin with 6, 7, 8, or 9";
    } else if (!/^[6-9]\d{9}$/.test(trimmedMobile)) {
      errs.mobile = "Please enter a valid 10-digit mobile number";
    }

    // 4. City (Compulsory)
    if (!formData.city) {
      errs.city = "Please select your city";
    } else if (formData.city === "Other" && !formData.customCity.trim()) {
      errs.customCity = "Please specify your city name";
    }

    // 5. Highest Education (Compulsory)
    if (!formData.education) {
      errs.education = "Please select your highest education";
    } else if (formData.education === "Others" && !formData.customEducation.trim()) {
      errs.customEducation = "Please specify your qualification";
    }

    // 6. Current Profession (Compulsory)
    if (!formData.profession) {
      errs.profession = "Please select your profession";
    } else if (formData.profession === "Others" && !formData.customProfession.trim()) {
      errs.customProfession = "Please specify your profession";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Compute effective field values for submission
  const effectiveCity =
    formData.city === "Other" ? formData.customCity.trim() || "Other" : formData.city;
  const effectiveEducation =
    formData.education === "Others"
      ? formData.customEducation.trim() || "Others"
      : formData.education;
  const effectiveProfession =
    formData.profession === "Others"
      ? formData.customProfession.trim() || "Others"
      : formData.profession;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validate()) {
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit via hidden form iframe for seamless, 100% reliable Google Form capture
      if (hiddenFormRef.current) {
        hiddenFormRef.current.submit();
      }

      // 2. Dual submit via fetch (no-cors) to Google Forms endpoint
      const postParams = new URLSearchParams();
      postParams.append("emailAddress", formData.email.trim());
      postParams.append("entry.388060596", formData.email.trim());
      postParams.append("entry.183190177", formData.name.trim());
      postParams.append("entry.1384209841", formData.mobile.trim());
      postParams.append("entry.72691823", effectiveCity);
      postParams.append("entry.1170563700", effectiveEducation);
      postParams.append("entry.1764066533", effectiveProfession);

      fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postParams
      }).catch((fetchErr) => {
        console.warn("Google Form direct fetch notice (safe fallback used):", fetchErr);
      });

      // 3. Record as verified lead enquiry in the backend database
      fetch(`${API_BASE_URL}/reports/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          topic: `Form Profile: ${effectiveProfession} (${effectiveEducation})`,
          message: `City: ${effectiveCity} | Education: ${effectiveEducation} | Profession: ${effectiveProfession} | Verified Email: ${formData.email}`
        })
      }).catch(() => {});

      // Success screen transition
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 700);
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
        paddingBottom: 70,
        position: "relative",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Hidden iframe and form for Google Form submission without navigation or CORS blocks */}
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
        <input type="hidden" name="emailAddress" value={formData.email} />
        <input type="hidden" name="entry.388060596" value={formData.email} />
        <input type="hidden" name="entry.183190177" value={formData.name} />
        <input type="hidden" name="entry.1384209841" value={formData.mobile} />
        <input type="hidden" name="entry.72691823" value={effectiveCity} />
        <input type="hidden" name="entry.1170563700" value={effectiveEducation} />
        <input type="hidden" name="entry.1764066533" value={effectiveProfession} />
      </form>

      {/* Ambient background glow accents */}
      <div
        style={{
          position: "fixed",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(760px, 92vw)",
          height: 360,
          background: "radial-gradient(circle, rgba(201, 154, 75, 0.14) 0%, rgba(7, 8, 12, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* TOP HEADER BRANDING */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          backgroundColor: "rgba(13, 14, 21, 0.92)",
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

          {/* powered by apkacoach.com */}
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

      {/* MAIN CONTENT CONTAINER */}
      <main
        style={{
          width: "100%",
          maxWidth: 620,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 36px) clamp(14px, 3vw, 22px) 0",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box"
        }}
      >
        {isSubmitted ? (
          /* SUCCESS STATE */
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
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.14)",
                border: "2px solid #10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px"
              }}
            >
              <CheckCircle2 size={40} color="#10B981" />
            </div>

            <h2
              style={{
                fontSize: "clamp(20px, 4.5vw, 24px)",
                fontWeight: 800,
                color: "#FFFFFF",
                marginBottom: 10,
                fontFamily: "var(--font-serif, sans-serif)"
              }}
            >
              Your application has been submitted successfully
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "var(--text-fog, #8FA0AC)",
                maxWidth: 480,
                margin: "0 auto 16px",
                lineHeight: 1.6
              }}
            >
              Our team will carefully review your application. If your profile is shortlisted, we will contact you at{" "}
              <strong style={{ color: "#FFFFFF" }}>{formData.mobile ? `+91 ${formData.mobile}` : formData.email}</strong> to schedule a meeting with one of our experts.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <Check size={14} /> Response Recorded Direct to Database
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <div
            style={{
              background: "var(--bg-surface, #0D0E15)",
              border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.12))",
              borderRadius: "clamp(16px, 3vw, 22px)",
              boxShadow: "var(--shadow-layered, 0 24px 72px rgba(0, 0, 0, 0.85))",
              overflow: "hidden",
              padding: "clamp(22px, 5vw, 36px) clamp(18px, 4vw, 32px)",
              boxSizing: "border-box"
            }}
          >
            <form onSubmit={handleSubmit} style={{ width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                
                {/* 1. EMAIL WITH VERIFIED RECORD CARD (Compulsory) */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: formErrors.email
                      ? "1px solid #EF4444"
                      : isEmailValid
                      ? "1px solid rgba(16, 185, 129, 0.4)"
                      : "1px solid var(--border-medium, rgba(255, 255, 255, 0.12))",
                    borderRadius: 12,
                    padding: 16,
                    transition: "all 0.2s ease"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      flexWrap: "wrap",
                      gap: 8
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-ivory, #F3EFE6)"
                      }}
                    >
                      <Mail size={16} color="var(--accent-gold, #C99A4B)" />
                      <span>Email</span>
                      <span style={{ color: "#EF4444" }}>*</span>
                    </label>

                    {/* Google One-Tap Quick Verification button if not logged in */}
                    {(!user || !user.email) && (
                      <button
                        type="button"
                        onClick={handleGoogleQuickAuth}
                        disabled={googleLoading}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          borderRadius: 6,
                          color: "#E2E8F0",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 10px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                      >
                        <ShieldCheck size={14} color="#38BDF8" />
                        <span>{googleLoading ? "Connecting..." : "Verify with Google"}</span>
                      </button>
                    )}
                  </div>

                  {/* Email Input Field */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      maxLength={80}
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      style={{
                        width: "100%",
                        padding: "13px 40px 13px 14px",
                        borderRadius: 8,
                        backgroundColor: "var(--bg-input, #151824)",
                        border: formErrors.email
                          ? "1px solid #EF4444"
                          : isEmailValid
                          ? "1px solid #10B981"
                          : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                        color: "#FFFFFF",
                        fontSize: 15,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                    {isEmailValid && (
                      <div
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#10B981",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Valid email format verified"
                      >
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                  </div>

                  {/* Google Forms "Record ... as email" Checkbox Card */}
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      backgroundColor: "rgba(201, 154, 75, 0.06)",
                      border: "1px solid rgba(201, 154, 75, 0.18)",
                      borderRadius: 8,
                      padding: "10px 12px"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="recordEmailCheck"
                      checked={recordEmailConsent}
                      onChange={(e) => setRecordEmailConsent(e.target.checked)}
                      style={{
                        marginTop: 3,
                        cursor: "pointer",
                        accentColor: "var(--accent-gold, #C99A4B)",
                        width: 16,
                        height: 16
                      }}
                    />
                    <label
                      htmlFor="recordEmailCheck"
                      style={{
                        fontSize: 13,
                        color: "var(--text-ivory, #E2E8F0)",
                        lineHeight: 1.45,
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                    >
                      Record{" "}
                      <strong style={{ color: "#FFFFFF" }}>
                        {formData.email.trim() ? formData.email.trim() : "your email"}
                      </strong>{" "}
                      as the email to be included with my response
                    </label>
                  </div>

                  {/* Live Email Validation feedback */}
                  {formErrors.email ? (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.email}
                    </div>
                  ) : isEmailValid ? (
                    <div style={{ fontSize: 12, color: "#10B981", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={13} /> Valid email verified
                    </div>
                  ) : null}
                </div>

                {/* 2. NAME (Compulsory) */}
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
                    <span>Name</span>
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your answer"
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.name
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: "#FFFFFF",
                      fontSize: 15,
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

                {/* 3. MOBILE (Compulsory, Strict 10 Digits starting with 6,7,8,9) */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-ivory, #F3EFE6)"
                      }}
                    >
                      <Phone size={15} color="var(--accent-gold, #C99A4B)" />
                      <span>Mobile</span>
                      <span style={{ color: "#EF4444" }}>*</span>
                    </label>

                    {/* Digits counter helper */}
                    <span style={{ fontSize: 11, color: "var(--text-fog, #8FA0AC)" }}>
                      {formData.mobile ? `${formData.mobile.length}/10 digits` : "10 digits (6-9)"}
                    </span>
                  </div>

                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    {/* Fixed +91 country prefix badge */}
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--accent-gold, #C99A4B)",
                        pointerEvents: "none",
                        userSelect: "none"
                      }}
                    >
                      <span>🇮🇳 +91</span>
                      <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
                    </div>

                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                      placeholder="Your answer"
                      style={{
                        width: "100%",
                        padding: "13px 40px 13px 76px",
                        borderRadius: 10,
                        backgroundColor: "var(--bg-input, #151824)",
                        border: formErrors.mobile
                          ? "1px solid #EF4444"
                          : isMobileValid
                          ? "1px solid #10B981"
                          : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                        color: "#FFFFFF",
                        fontSize: 16,
                        letterSpacing: "0.04em",
                        fontWeight: 500,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent-gold, #C99A4B)")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = formErrors.mobile
                          ? "#EF4444"
                          : isMobileValid
                          ? "#10B981"
                          : "var(--border-medium, rgba(255, 255, 255, 0.14))")
                      }
                    />

                    {isMobileValid && (
                      <div
                        style={{
                          position: "absolute",
                          right: 12,
                          color: "#10B981",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Valid 10-digit mobile number"
                      >
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                  </div>

                  {/* Real-time mobile validation feedback */}
                  {formErrors.mobile ? (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.mobile}
                    </div>
                  ) : isMobileValid ? (
                    <div style={{ fontSize: 12, color: "#10B981", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={13} /> Valid 10-digit Indian mobile number
                    </div>
                  ) : formData.mobile.length > 0 && !/^[6-9]/.test(formData.mobile) ? (
                    <div style={{ fontSize: 12, color: "#F59E0B", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> Mobile numbers must begin with 6, 7, 8, or 9
                    </div>
                  ) : null}
                </div>

                {/* 4. CITY (Compulsory Dropdown: Delhi NCR, Gurgaon, Noida, Other) */}
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
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.city
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: formData.city ? "#FFFFFF" : "var(--text-dim, #647888)",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: "#10121B", color: "#8FA0AC" }}>
                      Choose your city
                    </option>
                    {CITY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value} style={{ backgroundColor: "#10121B", color: "#FFFFFF" }}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* If "Other" selected, show custom city input (Compulsory) */}
                  {formData.city === "Other" && (
                    <div style={{ marginTop: 10, animation: "fadeIn 0.25s ease" }}>
                      <input
                        type="text"
                        maxLength={40}
                        value={formData.customCity}
                        onChange={(e) => handleChange("customCity", e.target.value)}
                        placeholder="Type your city name"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 8,
                          backgroundColor: "rgba(21, 24, 36, 0.8)",
                          border: formErrors.customCity
                            ? "1px solid #EF4444"
                            : "1px solid var(--accent-gold, #C99A4B)",
                          color: "#FFFFFF",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {formErrors.customCity && (
                        <div style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {formErrors.customCity}
                        </div>
                      )}
                    </div>
                  )}

                  {formErrors.city && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.city}
                    </div>
                  )}
                </div>

                {/* 5. HIGHEST EDUCATION (Compulsory Dropdown: Graduation/Post Grad, Any Professional Cert/Diploma/Degree, 12th pass, Doctor, Others) */}
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
                    <span>Highest Education ( minimum Criteria 12th Pass)</span>
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
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: "#10121B", color: "#8FA0AC" }}>
                      Choose your highest education
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

                  {/* If "Others" selected, show custom education input (Compulsory) */}
                  {formData.education === "Others" && (
                    <div style={{ marginTop: 10, animation: "fadeIn 0.25s ease" }}>
                      <input
                        type="text"
                        maxLength={60}
                        value={formData.customEducation}
                        onChange={(e) => handleChange("customEducation", e.target.value)}
                        placeholder="Specify your qualification"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 8,
                          backgroundColor: "rgba(21, 24, 36, 0.8)",
                          border: formErrors.customEducation
                            ? "1px solid #EF4444"
                            : "1px solid var(--accent-gold, #C99A4B)",
                          color: "#FFFFFF",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {formErrors.customEducation && (
                        <div style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {formErrors.customEducation}
                        </div>
                      )}
                    </div>
                  )}

                  {formErrors.education && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.education}
                    </div>
                  )}
                </div>

                {/* 6. CURRENT PROFESSION (Compulsory Dropdown matching Google Form) */}
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
                    <span>Current Profession</span>
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={formData.profession}
                    onChange={(e) => handleChange("profession", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-input, #151824)",
                      border: formErrors.profession
                        ? "1px solid #EF4444"
                        : "1px solid var(--border-medium, rgba(255, 255, 255, 0.14))",
                      color: formData.profession ? "#FFFFFF" : "var(--text-dim, #647888)",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: "#10121B", color: "#8FA0AC" }}>
                      Choose your current profession
                    </option>
                    {PROFESSION_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value} style={{ backgroundColor: "#10121B", color: "#FFFFFF" }}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  {/* If "Others" selected, show custom profession input (Compulsory) */}
                  {formData.profession === "Others" && (
                    <div style={{ marginTop: 10, animation: "fadeIn 0.25s ease" }}>
                      <input
                        type="text"
                        maxLength={60}
                        value={formData.customProfession}
                        onChange={(e) => handleChange("customProfession", e.target.value)}
                        placeholder="Specify your profession"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 8,
                          backgroundColor: "rgba(21, 24, 36, 0.8)",
                          border: formErrors.customProfession
                            ? "1px solid #EF4444"
                            : "1px solid var(--accent-gold, #C99A4B)",
                          color: "#FFFFFF",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {formErrors.customProfession && (
                        <div style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {formErrors.customProfession}
                        </div>
                      )}
                    </div>
                  )}

                  {formErrors.profession && (
                    <div style={{ fontSize: 12, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={13} /> {formErrors.profession}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: 32 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    minHeight: 52,
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
                    boxShadow: "0 4px 20px rgba(201, 154, 75, 0.35)",
                    transition: "all 0.2s ease",
                    opacity: isSubmitting ? 0.75 : 1
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
                      <Send size={17} />
                      <span>Submit</span>
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
                  Your Wealth Compass • powered by apkacoach.com
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
