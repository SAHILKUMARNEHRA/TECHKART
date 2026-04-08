"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, signInWithGoogle, signInWithCredentials, logout, authError } = useAuth();
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Account Access</h1>
      <p className="mt-2 text-slate-600">
        Use Google sign-in when Firebase is configured, or continue with credentials for local access.
      </p>

      {user ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-700">Logged in as {user.email}</p>
          <button
            type="button"
            onClick={() => router.push(next)}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Login with Credentials</h2>
            <p className="mt-2 text-sm text-slate-600">
              This works locally even when Firebase Google auth is not configured yet.
            </p>
            <form
              className="mt-5 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await signInWithCredentials(credentials);
                  setError("");
                  router.push(next);
                } catch (nextError) {
                  setError(
                    nextError instanceof Error
                      ? nextError.message
                      : "Could not sign in with credentials.",
                  );
                }
              }}
            >
              <input
                type="text"
                value={credentials.fullName}
                onChange={(event) =>
                  setCredentials((prev) => ({ ...prev, fullName: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Full name"
              />
              <input
                type="email"
                value={credentials.email}
                onChange={(event) =>
                  setCredentials((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Email address"
                required
              />
              <input
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Password"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Continue with Credentials
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Login with Google</h2>
            <p className="mt-2 text-sm text-slate-600">
              Google auth needs a valid Firebase web configuration and Google sign-in enabled in Firebase.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  setError("");
                  router.push(next);
                } catch (nextError) {
                  setError(
                    nextError instanceof Error
                      ? nextError.message
                      : "Could not sign in with Google.",
                  );
                }
              }}
              className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Continue with Google
            </button>
          </section>
        </div>
      )}

      {error || authError ? <p className="mt-4 text-sm text-rose-600">{error || authError}</p> : null}
    </div>
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
