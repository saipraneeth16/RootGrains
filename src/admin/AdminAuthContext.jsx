import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { adminAuth } from "../firebase";

const AdminAuthContext = createContext(null);

const BB_SUPER_ADMIN_EMAIL = "businessboxvizag@gmail.com";
// Only these emails can access the admin panel
const ADMIN_EMAILS = ["butchiricetradinggwk@gmail.com", "stanleyvanthala@gmail.com", "businessboxvizag@gmail.com"];

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      await signInWithEmailAndPassword(adminAuth, email, password);
    } catch (e) {
      setError(e.message || "Invalid email or password. Please try again.");
      throw e;
    }
  };

  const logout = async () => {
    await signOut(adminAuth);
  };

  const isBBAdmin = user?.email === BB_SUPER_ADMIN_EMAIL;
  const isKBRAdmin = user && ADMIN_EMAILS.includes(user.email);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isBBAdmin,
        isKBRAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);