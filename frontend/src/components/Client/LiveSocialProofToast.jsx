import React, { useState, useEffect } from "react";
import { X, CheckCircle2, ShieldCheck } from "lucide-react";

const RECENT_ACTIVITIES = [
  { title: "Ms.", name: "Priya S.", city: "Mumbai", action: "evaluated Financial Health Score (86/100)", time: "Just now" },
  { title: "Mr.", name: "Rahul M.", city: "Bengaluru", action: "discovered a ₹50 Lakhs protection gap", time: "Just now" },
  { title: "Mr.", name: "Rajat V.", city: "Delhi NCR", action: "generated a Full Diagnostic Report", time: "Just now" },
  { title: "Ms.", name: "Neha P.", city: "Pune", action: "modeled 6-Month Emergency Buffer plan", time: "Just now" },
  { title: "Mr.", name: "Kunal S.", city: "Jaipur", action: "planned Child Education & Milestone target", time: "Just now" },
  { title: "Ms.", name: "Ananya K.", city: "Hyderabad", action: "unlocked Inflation-Adjusted Retirement goal", time: "Just now" },
  { title: "Mr.", name: "Rohan D.", city: "Ahmedabad", action: "completed Financial Health Checkup (82/100)", time: "Just now" },
  { title: "Ms.", name: "Meera T.", city: "Chandigarh", action: "optimized monthly cash flow surplus", time: "Just now" },
  { title: "Mr.", name: "Aditya G.", city: "Gurugram", action: "downloaded Comprehensive Advisory Dossier", time: "Just now" }
];

export default function LiveSocialProofToast() {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * RECENT_ACTIVITIES.length));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let hideTimer;
    let nextTimer;

    const cycleToast = () => {
      setCurrentIndex((prev) => (prev + 1) % RECENT_ACTIVITIES.length);
      setIsVisible(true);

      // Keep visible for 6 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);

        // Pause for 3.2 seconds then show next
        nextTimer = setTimeout(cycleToast, 3200);
      }, 6000);
    };

    // First toast appears after 1.2 seconds
    const initialTimer = setTimeout(cycleToast, 1200);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, []);

  const handleDismissCurrent = () => {
    setIsVisible(false);
  };

  const current = RECENT_ACTIVITIES[currentIndex];
  const initial = current.name.charAt(0);

  return (
    <div
      className={`ff-live-toast-container ${isVisible ? "ff-live-toast-visible" : "ff-live-toast-hidden"}`}
      role="status"
      aria-live="polite"
    >
      <div className="ff-live-toast-card">
        {/* Left Glowing Gradient Accent Strip */}
        <div className="ff-live-toast-accent" />

        {/* User Avatar Circle */}
        <div className="ff-live-toast-avatar">
          {initial}
        </div>

        {/* Content */}
        <div className="ff-live-toast-body">
          <div className="ff-live-toast-user">
            <span className="ff-live-toast-name">{current.title} {current.name}</span>
            <span className="ff-live-toast-dot">&bull;</span>
            <span className="ff-live-toast-city">{current.city}</span>
            <span className="ff-live-toast-time">{current.time}</span>
          </div>
          <div className="ff-live-toast-action">
            {current.action}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismissCurrent}
          className="ff-live-toast-close"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
