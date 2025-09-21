// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Temporarily disabled
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBxCIkotXz8MIhOXrCR_qysYyVHY8qkuKQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "milo2-e7e31.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "milo2-e7e31",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "milo2-e7e31.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "832725574932",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:832725574932:web:c728c41cf997254fb08e01",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V9LCQ9S406"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Temporarily disable analytics to avoid installation errors
const analytics = null; // typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Lazy-initialize the AI service to prevent startup crashes
let generativeAIInstance: GoogleGenerativeAI | null = null;
export const getGenerativeAIService = () => {
  if (!generativeAIInstance) {
    // Use Google AI API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_AI_API_KEY not found in environment variables");
      return null;
    }
    generativeAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return generativeAIInstance;
};

// Connect to emulators in development, ensuring it only runs in the browser
// if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
//   console.log("Connecting to Firebase emulators");
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export { app, analytics, auth, db, functions };
