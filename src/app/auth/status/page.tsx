"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { CheckCircle2, CircleDashed, XCircle, ShieldCheck, UserCircle } from "lucide-react";

export default function AuthStatusPage() {
  return (
    <Suspense fallback={<StatusLoader message="Preparing authentication status..." />}>
      <StatusContent />
    </Suspense>
  );
}

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, authError } = useAuth();
  const [step, setStatusStep] = useState(1);
  const [dots, setDots] = useState("");
  
  const type = searchParams.get("type") || "Login";
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      // Step 1: Initialized
      setTimeout(() => setStatusStep(2), 800);
      // Step 2: Validating
      setTimeout(() => setStatusStep(3), 1800);
      // Step 3: Success, redirect
      setTimeout(() => {
        router.replace(next);
      }, 3000);
    }
  }, [authLoading, user, router, next]);

  if (authError) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Authentication Failed</h1>
        <p className="mt-3 text-slate-600">{authError}</p>
        <button
          onClick={() => router.replace("/login")}
          className="mt-8 rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 text-center">
        <div className="relative mb-10 flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 animate-ping rounded-full bg-cyan-100/50 duration-[2000ms]"></div>
          </div>
          <div className="relative h-24 w-24 rounded-full bg-[linear-gradient(135deg,#0057d9,#4aa3ff)] flex items-center justify-center text-white shadow-lg shadow-blue-200">
            {step === 3 ? <ShieldCheck size={44} className="animate-in zoom-in duration-300" /> : <UserCircle size={44} />}
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {step === 3 ? "Successfully Verified" : `${type} in Progress${dots}`}
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          {step === 1 && "Connecting to secure authentication services..."}
          {step === 2 && "Syncing your profile and verifying credentials..."}
          {step === 3 && "Authentication successful! Taking you to TechKart..."}
        </p>

        <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
          <StepItem 
            active={step >= 1} 
            completed={step > 1} 
            label="Initiating secure connection" 
          />
          <StepItem 
            active={step >= 2} 
            completed={step > 2} 
            label="Validating account metadata" 
          />
          <StepItem 
            active={step >= 3} 
            completed={step >= 3} 
            label="Finalizing session security" 
          />
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Powered by Firebase Secure Auth
          </p>
        </div>
      </div>
    </div>
  );
}

function StepItem({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-2'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
        completed 
          ? 'bg-emerald-500 border-emerald-500 text-white' 
          : active 
            ? 'border-cyan-500 text-cyan-600 animate-pulse' 
            : 'border-slate-200 text-slate-300'
      }`}>
        {completed ? <CheckCircle2 size={18} /> : <CircleDashed size={18} className={active ? 'animate-spin' : ''} />}
      </div>
      <span className={`text-sm font-semibold ${completed ? 'text-slate-900' : active ? 'text-cyan-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StatusLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <CircleDashed size={40} className="animate-spin text-cyan-600" />
      <p className="mt-4 font-medium text-slate-600">{message}</p>
    </div>
  );
}
