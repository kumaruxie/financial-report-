import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "financial-fitness-a6116.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "financial-fitness-a6116",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "financial-fitness-a6116.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "490887071813",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:490887071813:web:b6e7b41450cad91d9dfb2c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LEDFSPK6FQ"
};

// Initialize Firebase App safely ONLY if a valid API key is present
let app = null;
let auth = null;
let googleProvider = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } else {
    console.info("ℹ️ Firebase API key not set in environment. Running in resilient fallback mode without Firebase.");
  }
} catch (err) {
  console.warn("Firebase Auth initialization notice:", err?.message || err);
}

// Helper: Setup invisible Recaptcha for phone auth
export function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined" || !auth) return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
    window.recaptchaVerifier = null;
  }
  container.innerHTML = "";

  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired, resetting...");
      }
    });
  } catch (err) {
    console.warn("RecaptchaVerifier init error:", err?.message || err);
    return null;
  }

  return window.recaptchaVerifier;
}

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber
};

export default app;
