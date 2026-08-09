import React, { createContext, useContext, useState, useEffect } from "react";
import { requestOtpApi, verifyOtpApi } from "../services/api";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "ff_auth_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [portalMode, setPortalMode] = useState("client"); // 'client' | 'admin'
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [pendingRole, setPendingRole] = useState("client");

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to sync auth session", e);
    }
  }, [user]);

  const requestOtp = async (identifier, role = "client") => {
    setOtpTarget(identifier);
    setPendingRole(role);
    setIsOtpOpen(true);
    await requestOtpApi(identifier);
  };

  const verifyOtp = async (code, extraData = {}) => {
    const res = await verifyOtpApi(otpTarget, code, extraData.name);
    const newUser = res.user || {
      id: "usr_" + Date.now(),
      identifier: otpTarget,
      email: otpTarget.includes("@") ? otpTarget : `${otpTarget}@client.com`,
      name: extraData.name || (pendingRole === "admin" ? "Aditya Consultant" : "Client User"),
      role: pendingRole
    };
    setUser(newUser);
    setIsOtpOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setPortalMode("client");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        portalMode,
        setPortalMode,
        isOtpOpen,
        setIsOtpOpen,
        otpTarget,
        requestOtp,
        verifyOtp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
