import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "../services/firebase";
import {
  sendDualOtpApi,
  verifyDualOtpRegisterApi,
  verifyLoginOtpApi,
  forgotPasswordResetApi,
  loginUserApi
} from "../services/api";

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

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [portalMode, setPortalMode] = useState("client"); // 'client' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin"); // 'signin' | 'signup' | 'forgot'

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken().catch(() => "");
        const formattedUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Client User"),
          email: firebaseUser.email || "",
          mobile: firebaseUser.phoneNumber || "",
          photoURL: firebaseUser.photoURL || null,
          role: "client",
          token
        };
        setUser(formattedUser);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(formattedUser));
        } catch (e) {}
      } else {
        // If not authenticated via Firebase, check if local storage session exists
        try {
          const localSaved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (parsed && (parsed.token || parsed.id)) {
              setUser(parsed);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. Google 1-Click Sign-In
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const token = await fbUser.getIdToken().catch(() => "");
      const formattedUser = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split("@")[0],
        email: fbUser.email || "",
        mobile: fbUser.phoneNumber || "",
        photoURL: fbUser.photoURL || null,
        role: "client",
        token
      };
      setUser(formattedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(formattedUser));
      } catch (e) {}
      setIsAuthModalOpen(false);
      return { success: true, user: formattedUser };
    } catch (err) {
      console.error("Google sign in error:", err);
      let msg = "Google sign-in failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Sign-in cancelled.";
      } else if (err.code === "auth/unauthorized-domain") {
        msg = "Domain not authorized in Firebase Console. Please add localhost under Auth > Settings > Authorized domains.";
      }
      return { success: false, error: msg };
    }
  };

  // 2. Email & Password Sign In
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      // First try Firebase Email Auth
      const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken().catch(() => "");
      const formattedUser = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split("@")[0],
        email: fbUser.email || cleanEmail,
        mobile: fbUser.phoneNumber || "",
        role: "client",
        token
      };
      setUser(formattedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(formattedUser));
      } catch (e) {}
      setIsAuthModalOpen(false);
      return { success: true, user: formattedUser };
    } catch (fbErr) {
      // If Firebase email sign in fails, check backend DB
      const res = await loginUserApi(cleanEmail, password);
      if (res && res.success) {
        setUser(res.user);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
        } catch (e) {}
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }

      let msg = "Invalid email or password.";
      if (fbErr.code === "auth/user-not-found" || fbErr.code === "auth/wrong-password" || fbErr.code === "auth/invalid-credential") {
        msg = "Invalid email or password. Please check and try again.";
      } else if (res && res.error) {
        msg = res.error;
      }
      return { success: false, error: msg };
    }
  };

  // 3. Send Dual OTP (Email & Mobile simultaneously)
  const sendDualOtp = async ({ email, mobile, name, type = "register" }) => {
    try {
      const res = await sendDualOtpApi({
        email: email.trim().toLowerCase(),
        mobile: (mobile || "").trim(),
        name: (name || "").trim(),
        type
      });
      return res;
    } catch (err) {
      console.error("sendDualOtp error:", err);
      return { success: false, error: "Failed to send verification code." };
    }
  };

  // 4. Verify Dual OTP & Complete Registration
  const verifyDualOtpRegister = async (payload) => {
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      // Verify with backend
      const res = await verifyDualOtpRegisterApi({
        ...payload,
        email: cleanEmail
      });

      if (res && res.success) {
        // Also create in Firebase if possible in background
        try {
          const fbRes = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
          if (payload.name) {
            await updateProfile(fbRes.user, { displayName: payload.name.trim() }).catch(() => {});
          }
        } catch (fbE) {
          console.warn("Background Firebase register notice:", fbE.message);
        }

        setUser(res.user);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
        } catch (e) {}
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }

      return { success: false, error: res.error || "Invalid verification code." };
    } catch (err) {
      console.error("verifyDualOtpRegister error:", err);
      return { success: false, error: "Verification failed. Please try again." };
    }
  };

  // 5. Reset Password with OTP
  const forgotPasswordReset = async ({ email, otp, newPassword }) => {
    try {
      const res = await forgotPasswordResetApi({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      });

      if (res && res.success) {
        if (res.user) {
          setUser(res.user);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
          } catch (e) {}
        }
        setIsAuthModalOpen(false);
        return { success: true, message: res.message, user: res.user };
      }
      return { success: false, error: res.error || "Failed to reset password." };
    } catch (err) {
      console.error("forgotPasswordReset error:", err);
      return { success: false, error: "Reset failed. Please try again." };
    }
  };

  // 6. Login with Mobile OTP
  const loginWithMobileOtp = async ({ mobile, email, otp }) => {
    try {
      const res = await verifyLoginOtpApi({ mobile, email, otp });
      if (res && res.success) {
        setUser(res.user);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
        } catch (e) {}
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      return { success: false, error: res?.error || "Invalid OTP code." };
    } catch (err) {
      console.error("loginWithMobileOtp error:", err);
      return { success: false, error: "Authentication failed. Please try again." };
    }
  };

  // 7. Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setPortalMode("client");
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingAuth,
        portalMode,
        setPortalMode,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        loginWithMobileOtp,
        sendDualOtp,
        verifyDualOtpRegister,
        forgotPasswordReset,
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
