'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 font-sans">
        <div className="mb-6 rounded-full bg-red-100 p-6">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
        </div>
        <h2 className="mb-2 text-3xl font-bold text-slate-900">Critical Error</h2>
        <p className="mb-8 max-w-md text-slate-600">
          The application encountered a critical error. This usually happens when environment variables are missing or misconfigured in the deployment settings.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-700 px-8 py-3 font-semibold text-white transition hover:bg-blue-800 shadow-lg shadow-blue-200"
        >
          Restart Application
        </button>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-8 max-w-full overflow-auto rounded-lg bg-slate-200 p-4 text-left text-xs text-red-700">
            {error.message}
            {error.stack}
          </pre>
        )}
      </body>
    </html>
  );
}
