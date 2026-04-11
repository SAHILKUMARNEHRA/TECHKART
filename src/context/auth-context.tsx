"use client";

import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const ADMIN_EMAIL = "sk.nehra2005@gmail.com";
const LOCAL_AUTH_KEY = "techkart_auth_user";

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
  toggleBlockedUser: (email: string) => void;
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

// Simplified, high-performance auth persistence
function readLocalUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(LOCAL_AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function writeLocalUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch {}
}

const authCache = new Map<string, { raw: string | null; parsed: unknown }>();

function readJsonStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    const cached = authCache.get(key);

    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }

    const parsed = raw ? (JSON.parse(raw) as T) : fallback;
    authCache.set(key, { raw, parsed });
    return parsed;
  } catch {
    return fallback;
  }
}

function writeJsonStore<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(value);
  authCache.set(key, { raw, parsed: value });
  localStorage.setItem(key, raw);
  window.dispatchEvent(new Event(`techkart-auth:${key}`));
}

function subscribeStoreKey(key: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      callback();
    }
  };

  const internalEventName = `techkart-auth:${key}`;
  const onInternal = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(internalEventName, onInternal);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(internalEventName, onInternal);
  };
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function isBlockedEmail(email: string | null | undefined, blockedList: string[]) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  return blockedList.includes(normalized);
}

async function appendAuthLog(entry: Omit<AuthLogEntry, "id" | "createdAt">) {
  if (!isFirebaseConfigured) return;
  
  const logEntry: AuthLogEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };

  try {
    const logRef = doc(collection(db, "auth_logs"), logEntry.id);
    await setDoc(logRef, logEntry);
  } catch (error) {
    console.error("Error appending auth log:", error);
  }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readLocalUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authLogs, setAuthLogs] = useState<AuthLogEntry[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Only one listener for essential global data
    const settingsRef = doc(db, "settings", "access_control");
    const unsubBlocked = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setBlockedUsers(snapshot.data().blockedEmails || []);
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        const mapped = mapFirebaseUser(nextUser);
        setUser(mapped);
        writeLocalUser(mapped);
      } else {
        // Only clear if we were using Firebase (not credentials)
        if (user?.provider === "google") {
          setUser(null);
          writeLocalUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubBlocked();
      unsubAuth();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      isAdmin: normalizeEmail(user?.email) === ADMIN_EMAIL,
      blockedUsers,
      authLogs,
      signInWithGoogle: async () => {
        if (!isFirebaseConfigured) {
          throw new Error(
            "Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* values.",
          );
        }
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const nextUser = result.user;
          const normalizedEmail = normalizeEmail(nextUser.email);

          if (isBlockedEmail(normalizedEmail, blockedUsers)) {
            await appendAuthLog({
              email: normalizedEmail,
              displayName: nextUser.displayName ?? normalizedEmail,
              provider: "google",
              action: "blocked_attempt",
            });
            await signOut(auth);
            throw new Error("This account has been blocked by admin access control.");
          }

          await appendAuthLog({
            email: normalizedEmail,
            displayName: nextUser.displayName ?? normalizedEmail,
            provider: "google",
            action: "login",
          });
          setAuthError("");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Google sign-in failed.";
          if (message.includes("auth/unauthorized-domain")) {
            const nextMessage =
              "Google sign-in is blocked because this deployed domain is not authorized in Firebase. Add your site domain in Firebase Console > Authentication > Settings > Authorized domains.";
            setAuthError(nextMessage);
            throw new Error(nextMessage);
          }
          if (message.includes("auth/api-key-not-valid")) {
            const nextMessage =
              "Google sign-in is unavailable because the Firebase API key is invalid. Add a valid Firebase Web API key in .env.local and restart. Credentials login still works locally.";
            setAuthError(nextMessage);
            throw new Error(nextMessage);
          }
          setAuthError(message);
          throw error;
        }
      },
      signInWithCredentials: async (input: { email: string; password: string; fullName?: string }) => {
        setLoading(true);
        setAuthError("");
        const normalizedEmail = normalizeEmail(input.email);
        const normalizedName = input.fullName?.trim() || "";

        if (blockedUsers.includes(normalizedEmail)) {
          setLoading(false);
          throw new Error("This account has been blocked.");
        }

        const localUser: AuthUser = {
          uid: `local-${normalizedEmail}`,
          email: normalizedEmail,
          displayName: normalizedName || normalizedEmail.split("@")[0],
          provider: "credentials",
        };

        setUser(localUser);
        await appendAuthLog({
          email: normalizedEmail,
          displayName: localUser.displayName ?? normalizedEmail,
          provider: "credentials",
          action: "login",
        });
        setLoading(false);
      },
      logout: async () => {
        setLoading(true);
        const activeUser = user;
        if (auth.currentUser) {
          await signOut(auth);
        }
        setUser(null);
        if (activeUser?.email) {
          await appendAuthLog({
            email: normalizeEmail(activeUser.email),
            displayName: activeUser.displayName ?? activeUser.email,
            provider: activeUser.provider,
            action: "logout",
          });
        }
        setAuthError("");
        setLoading(false);
      },
      toggleBlockedUser: async (email: string) => {
        const normalized = normalizeEmail(email);
        if (!normalized || normalized === ADMIN_EMAIL || !isFirebaseConfigured) {
          return;
        }

        try {
          const settingsRef = doc(db, "settings", "access_control");
          const isCurrentlyBlocked = blockedUsers.includes(normalized);
          
          await updateDoc(settingsRef, {
            blockedEmails: isCurrentlyBlocked 
              ? arrayRemove(normalized) 
              : arrayUnion(normalized)
          });
        } catch (error) {
          // If document doesn't exist, create it
          const settingsRef = doc(db, "settings", "access_control");
          await setDoc(settingsRef, {
            blockedEmails: [normalized]
          }, { merge: true });
        }

        if (user?.email && normalizeEmail(user.email) === normalized) {
          writeLocalUser(null);
          setUser(null);
        }
      },
    }),
    [authError, authLogs, blockedUsers, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
