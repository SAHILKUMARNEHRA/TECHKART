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
  getDoc,
} from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const ADMIN_EMAIL = "sk.nehra2005@gmail.com";
const LOCAL_STORAGE_KEY = "techkart_session_v1";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  provider: "google" | "credentials";
}

export interface AuthLogEntry {
  id: string;
  email: string;
  displayName: string;
  provider: "google" | "credentials";
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
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (input: {
    email: string;
    password: string;
    fullName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  toggleBlockedUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    provider: "google",
  };
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1. Initial State from LocalStorage for Instant UI
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authLogs, setAuthLogs] = useState<AuthLogEntry[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // 2. Persistent Storage Helper
  const persistUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      if (nextUser) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // 3. Auth Log Helper
  const appendLog = useCallback(async (entry: Omit<AuthLogEntry, "id" | "createdAt">) => {
    if (!isFirebaseConfigured) return;
    const logEntry: AuthLogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    };
    try {
      await setDoc(doc(collection(db, "auth_logs"), logEntry.id), logEntry);
    } catch (e) {
      console.error("Log error:", e);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // A. Real-time Blocked Users List
    const unsubBlocked = onSnapshot(doc(db, "settings", "access_control"), (snap) => {
      if (snap.exists()) setBlockedUsers(snap.data().blockedEmails || []);
    });

    // B. Real-time Logs (Admin Only Feel)
    const logsQuery = query(collection(db, "auth_logs"), orderBy("createdAt", "desc"), limit(30));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setAuthLogs(snap.docs.map(d => d.data() as AuthLogEntry));
    });

    // C. Firebase Auth Observer
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mapped = mapFirebaseUser(firebaseUser);
        persistUser(mapped);
      } else {
        // Only clear if not using credentials
        const current = readLocalSession();
        if (current?.provider === "google") persistUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubBlocked();
      unsubLogs();
      unsubAuth();
    };
  }, [persistUser]);

  function readLocalSession(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    isAdmin: normalizeEmail(user?.email) === ADMIN_EMAIL,
    blockedUsers,
    authLogs,
    signInWithGoogle: async () => {
      setAuthError("");
      persistUser(null);
      try {
        const res = await signInWithPopup(auth, googleProvider);
        const mapped = mapFirebaseUser(res.user);
        persistUser(mapped);
        await appendLog({
          email: normalizeEmail(mapped.email),
          displayName: mapped.displayName ?? mapped.email ?? "User",
          provider: "google",
          action: "login",
        });
      } catch (e: any) {
        if (e.code !== "auth/popup-closed-by-user") setAuthError(e.message);
      }
    },
    signInWithCredentials: async (input: { email: string; fullName?: string }) => {
      setAuthError("");
      const email = normalizeEmail(input.email);
      const name = input.fullName?.trim() || email.split("@")[0];
      
      const credUser: AuthUser = {
        uid: `c-${email}`,
        email,
        displayName: name,
        provider: "credentials",
      };
      
      persistUser(credUser);
      await appendLog({
        email,
        displayName: name,
        provider: "credentials",
        action: "login",
      });
    },
    logout: async () => {
      const prev = user;
      if (auth.currentUser) await signOut(auth);
      persistUser(null);
      if (prev?.email) {
        await appendLog({
          email: normalizeEmail(prev.email),
          displayName: prev.displayName ?? prev.email,
          provider: prev.provider,
          action: "logout",
        });
      }
    },
    toggleBlockedUser: async (email: string) => {
      // Admin only logic handled via Firestore updateDoc elsewhere or added here if needed
      console.log("Toggle block:", email);
    }
  }), [user, loading, authError, blockedUsers, authLogs, persistUser, appendLog]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
