import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRI3roS2j8VfVK_mEsLtYuIq2gspZKjpQ",
  authDomain: "kbr-app-9991a.firebaseapp.com",
  projectId: "kbr-app-9991a",
  storageBucket: "kbr-app-9991a.firebasestorage.app",
  messagingSenderId: "823515119777",
  appId: "1:823515119777:web:2aea5a7b71f7ab1fbe0cb8",
  measurementId: "G-1JRZSG8NKQ",
};

// Main app — used by the store (customer auth + Firestore)
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app, "default");
export const auth = getAuth(app);

// Separate admin app instance — completely independent auth session
// This means admin login and customer login don't interfere with each other
const adminApp = initializeApp(firebaseConfig, "admin");
export const adminAuth = getAuth(adminApp);

export default app;