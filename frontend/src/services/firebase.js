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

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Helper: Setup invisible Recaptcha for phone auth
export function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
    window.recaptchaVerifier = null;
  }
  container.innerHTML = "";

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired, resetting...");
    }
  });

  return window.recaptchaVerifier;
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber
};

export default app;
