"use client";

import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
} from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const ADMIN_EMAIL = "sk.nehra2005@gmail.com";
const SESSION_STORAGE_KEY = "techkart_pro_session";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  provider: "professional" | "normal";
  lastLogin: string;
}

export interface AuthLogEntry {
  id: string;
  email: string;
  displayName: string;
  provider: "professional" | "normal";
  action: "login" | "logout" | "blocked_attempt";
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authError: string;
  isAdmin: boolean;
  blockedUsers: string[];
  authLogs: AuthLogEntry[];
  loginProfessional: () => Promise<void>;
  loginNormal: (input: { email: string; fullName?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // --- Professional Session Management ---
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authLogs, setAuthLogs] = useState<AuthLogEntry[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const persistSession = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      if (nextUser) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const appendAuditLog = useCallback(async (entry: Omit<AuthLogEntry, "id" | "createdAt">) => {
    if (!isFirebaseConfigured) return;
    const logEntry: AuthLogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    };
    try {
      await setDoc(doc(collection(db, "auth_logs"), logEntry.id), logEntry);
    } catch (e) {
      console.error("Audit log failed:", e);
    }
  }, []);

  // --- Real-time Cloud Data Synchronization ---
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // A. Security Policy Sync (Blocked Users)
    const unsubBlocked = onSnapshot(doc(db, "settings", "access_control"), (snap) => {
      if (snap.exists()) setBlockedUsers(snap.data().blockedEmails || []);
    });

    // B. Real-time Audit Logs (Top 30)
    const unsubLogs = onSnapshot(
      query(collection(db, "auth_logs"), orderBy("createdAt", "desc"), limit(30)),
      (snap) => setAuthLogs(snap.docs.map(d => d.data() as AuthLogEntry))
    );

    // C. Firebase Auth State Observer
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const proUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          provider: "professional",
          lastLogin: new Date().toISOString(),
        };
        persistSession(proUser);
      } else {
        // Only clear if the current session was Professional
        const current = user;
        if (current?.provider === "professional") persistSession(null);
      }
      setLoading(false);
    });

    return () => {
      unsubBlocked();
      unsubLogs();
      unsubAuth();
    };
  }, [persistSession, user]);

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    isAdmin: normalizeEmail(user?.email) === ADMIN_EMAIL,
    blockedUsers,
    authLogs,
    
    // --- PROFESSIONAL LOGIN (GOOGLE) ---
    loginProfessional: async () => {
      setAuthError("");
      persistSession(null); // Hard reset
      try {
        const res = await signInWithPopup(auth, googleProvider);
        const proUser: AuthUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          provider: "professional",
          lastLogin: new Date().toISOString(),
        };
        persistSession(proUser);
        await appendAuditLog({
          email: normalizeEmail(proUser.email),
          displayName: proUser.displayName ?? proUser.email ?? "Pro User",
          provider: "professional",
          action: "login",
        });
      } catch (e: any) {
        if (e.code !== "auth/popup-closed-by-user") setAuthError(e.message);
      }
    },

    // --- NORMAL LOGIN (CREDENTIALS) ---
    loginNormal: async (input: { email: string; fullName?: string }) => {
      setAuthError("");
      const email = normalizeEmail(input.email);
      const name = input.fullName?.trim() || email.split("@")[0];
      
      const normalUser: AuthUser = {
        uid: `normal-${email}`,
        email,
        displayName: name,
        provider: "normal",
        lastLogin: new Date().toISOString(),
      };
      
      persistSession(normalUser);
      await appendAuditLog({
        email,
        displayName: name,
        provider: "normal",
        action: "login",
      });
    },

    logout: async () => {
      const prev = user;
      if (auth.currentUser) await signOut(auth);
      persistSession(null);
      if (prev?.email) {
        await appendAuditLog({
          email: normalizeEmail(prev.email),
          displayName: prev.displayName ?? prev.email,
          provider: prev.provider,
          action: "logout",
        });
      }
    }
  }), [user, loading, authError, blockedUsers, authLogs, persistSession, appendAuditLog]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
