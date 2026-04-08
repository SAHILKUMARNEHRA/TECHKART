"use client";

import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const LOCAL_AUTH_KEY = "techkart_local_auth";
const AUTH_LOG_KEY = "techkart_auth_log";
const BLOCKED_USERS_KEY = "techkart_blocked_users";
const ADMIN_EMAIL = "sk.nehra2005@gmail.com";

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

function readLocalUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeLocalUser(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    return;
  }

  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
}

function readJsonStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStore<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
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

function isBlockedEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return readJsonStore<string[]>(BLOCKED_USERS_KEY, []).includes(normalized);
}

function appendAuthLog(entry: Omit<AuthLogEntry, "id" | "createdAt">) {
  const nextEntry: AuthLogEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };

  const current = readJsonStore<AuthLogEntry[]>(AUTH_LOG_KEY, []);
  writeJsonStore(AUTH_LOG_KEY, [nextEntry, ...current].slice(0, 100));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readLocalUser());
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState(
    isFirebaseConfigured
      ? ""
      : "Google sign-in needs a valid Firebase configuration. Credentials login works locally right now.",
  );
  const authLogs = useSyncExternalStore(
    (callback) => subscribeStoreKey(AUTH_LOG_KEY, callback),
    () => readJsonStore<AuthLogEntry[]>(AUTH_LOG_KEY, []),
    () => [],
  );
  const blockedUsers = useSyncExternalStore(
    (callback) => subscribeStoreKey(BLOCKED_USERS_KEY, callback),
    () => readJsonStore<string[]>(BLOCKED_USERS_KEY, []),
    () => [],
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return () => undefined;
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser?.email && isBlockedEmail(nextUser.email)) {
        appendAuthLog({
          email: normalizeEmail(nextUser.email),
          displayName: nextUser.displayName ?? nextUser.email,
          provider: "google",
          action: "blocked_attempt",
        });
        await signOut(auth);
        setUser(null);
        setAuthError("This account has been blocked by admin access control.");
        setLoading(false);
        return;
      }

      setUser(nextUser ? mapFirebaseUser(nextUser) : readLocalUser());
      setLoading(false);
    });

    return () => unsub();
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

          if (isBlockedEmail(normalizedEmail)) {
            appendAuthLog({
              email: normalizedEmail,
              displayName: nextUser.displayName ?? normalizedEmail,
              provider: "google",
              action: "blocked_attempt",
            });
            await signOut(auth);
            throw new Error("This account has been blocked by admin access control.");
          }

          appendAuthLog({
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
      signInWithCredentials: async ({
        email,
        password,
        fullName,
      }: {
        email: string;
        password: string;
        fullName?: string;
      }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = fullName?.trim();

        if (!normalizedEmail) {
          throw new Error("Enter an email address to continue.");
        }

        if (password.trim().length < 6) {
          throw new Error("Enter a password with at least 6 characters.");
        }

        if (isBlockedEmail(normalizedEmail)) {
          appendAuthLog({
            email: normalizedEmail,
            displayName: normalizedName || normalizedEmail,
            provider: "credentials",
            action: "blocked_attempt",
          });
          throw new Error("This account has been blocked by admin access control.");
        }

        const localUser: AuthUser = {
          uid: `local-${normalizedEmail}`,
          email: normalizedEmail,
          displayName: normalizedName || normalizedEmail.split("@")[0],
          provider: "credentials",
        };

        writeLocalUser(localUser);
        appendAuthLog({
          email: normalizedEmail,
          displayName: localUser.displayName ?? normalizedEmail,
          provider: "credentials",
          action: "login",
        });
        setUser(localUser);
        setAuthError(
          isFirebaseConfigured
            ? ""
            : "Signed in with local credentials. Add a valid Firebase web config to enable Google sign-in too.",
        );
      },
      logout: async () => {
        const activeUser = user;
        if (auth.currentUser) {
          await signOut(auth);
        }
        writeLocalUser(null);
        setUser(null);
        if (activeUser?.email) {
          appendAuthLog({
            email: normalizeEmail(activeUser.email),
            displayName: activeUser.displayName ?? activeUser.email,
            provider: activeUser.provider,
            action: "logout",
          });
        }
        setAuthError(
          isFirebaseConfigured
            ? ""
            : "Google sign-in needs a valid Firebase configuration. Credentials login works locally right now.",
        );
      },
      toggleBlockedUser: (email: string) => {
        const normalized = normalizeEmail(email);
        if (!normalized || normalized === ADMIN_EMAIL) {
          return;
        }

        const current = readJsonStore<string[]>(BLOCKED_USERS_KEY, []);
        const next = current.includes(normalized)
          ? current.filter((item) => item !== normalized)
          : [...current, normalized].sort();
        writeJsonStore(BLOCKED_USERS_KEY, next);

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
