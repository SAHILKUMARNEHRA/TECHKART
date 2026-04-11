"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, Mail, Lock, User as UserIcon, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-16 text-center">Loading authentication...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, signInWithGoogle, signInWithCredentials, logout, authError } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [credentials, setCredentials] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const onGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      router.push(`/auth/status?type=Login&next=${encodeURIComponent(next)}`);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not sign in with Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onCredentialsAction = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signInWithCredentials(credentials);
      router.push(`/auth/status?type=${mode === "login" ? "Login" : "Sign+Up"}&next=${encodeURIComponent(next)}`);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : `Could not ${mode} with credentials.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left Side: Branding & Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Welcome to <span className="text-blue-600">TechKart</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Join thousands of tech enthusiasts. Get access to exclusive deals, real-time price tracking, and a seamless checkout experience.
          </p>
          
          <div className="mt-10 space-y-4">
            <FeatureItem icon={<LogIn className="text-blue-500" />} text="Quick one-tap Google authentication" />
            <FeatureItem icon={<ShieldCheck className="text-emerald-500" />} text="Secure real-time database persistence" />
            <FeatureItem icon={<UserPlus className="text-orange-500" />} text="Personalized order tracking & history" />
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="relative">
          {user ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                <UserIcon size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Already Signed In</h2>
              <p className="mt-2 text-slate-600">You are currently logged in as <span className="font-semibold text-slate-900">{user.email}</span></p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => router.push(next)}
                  className="rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
                >
                  Go to TechKart
                </button>
                <button
                  onClick={logout}
                  className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-4 text-sm font-bold transition-all ${mode === "login" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-400 hover:text-slate-600"}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-4 text-sm font-bold transition-all ${mode === "signup" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-400 hover:text-slate-600"}`}
                >
                  Sign Up
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={onCredentialsAction} className="space-y-4">
                  {mode === "signup" && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        disabled={loading}
                        value={credentials.fullName}
                        onChange={(e) => setCredentials(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      disabled={loading}
                      value={credentials.email}
                      onChange={(e) => setCredentials(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email Address"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      disabled={loading}
                      value={credentials.password}
                      onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
                      placeholder="Password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <CircleDashed className="animate-spin" size={18} />
                        {mode === "login" ? "Signing in..." : "Creating Account..."}
                      </span>
                    ) : (
                      <span>{mode === "login" ? "Login to Account" : "Create Free Account"}</span>
                    )}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span>OR</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          )}

          {error || authError ? (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-600">
              {error || authError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700">{text}</span>
    </div>
  );
}

function CircleDashed({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M10.1 2.18a10 10 0 0 1 3.8 0" />
      <path d="M13.9 21.82a10 10 0 0 1-3.8 0" />
      <path d="M2.18 13.9a10 10 0 0 1 0-3.8" />
      <path d="M21.82 10.1a10 10 0 0 1 0 3.8" />
      <path d="M6.5 4.04a10 10 0 0 0-2.46 2.46" />
      <path d="M4.04 17.5a10 10 0 0 0 2.46 2.46" />
      <path d="M17.5 19.96a10 10 0 0 0 2.46-2.46" />
      <path d="M19.96 6.5a10 10 0 0 0-2.46-2.46" />
    </svg>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Account Access</h1>
      <p className="mt-2 text-slate-600">Loading sign-in options...</p>
    </div>
  );
}
