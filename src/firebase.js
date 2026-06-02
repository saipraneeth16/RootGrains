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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app, "default");
export const auth = getAuth(app);
export default app;