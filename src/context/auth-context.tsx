"use client";

import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const LOCAL_AUTH_KEY = "techkart_local_auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  provider: "google" | "credentials";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authError: string;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (input: {
    email: string;
    password: string;
    fullName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readLocalUser());
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState(
    isFirebaseConfigured
      ? ""
      : "Google sign-in needs a valid Firebase configuration. Credentials login works locally right now.",
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return () => undefined;
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
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
      signInWithGoogle: async () => {
        if (!isFirebaseConfigured) {
          throw new Error(
            "Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* values.",
          );
        }
        try {
          await signInWithPopup(auth, googleProvider);
          setAuthError("");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Google sign-in failed.";
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

        const localUser: AuthUser = {
          uid: `local-${normalizedEmail}`,
          email: normalizedEmail,
          displayName: normalizedName || normalizedEmail.split("@")[0],
          provider: "credentials",
        };

        writeLocalUser(localUser);
        setUser(localUser);
        setAuthError(
          isFirebaseConfigured
            ? ""
            : "Signed in with local credentials. Add a valid Firebase web config to enable Google sign-in too.",
        );
      },
      logout: async () => {
        if (auth.currentUser) {
          await signOut(auth);
        }
        writeLocalUser(null);
        setUser(null);
        setAuthError(
          isFirebaseConfigured
            ? ""
            : "Google sign-in needs a valid Firebase configuration. Credentials login works locally right now.",
        );
      },
    }),
    [authError, loading, user],
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
