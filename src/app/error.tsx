'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-red-50 p-6">
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
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Something went wrong!</h2>
      <p className="mb-4 max-w-md text-slate-600">
        We encountered an error while loading this page. This might be due to a temporary network issue or missing configuration.
      </p>
      <div className="mb-8 max-w-2xl overflow-auto rounded-lg bg-slate-50 p-4 text-left text-xs text-red-700">
        <p className="font-bold mb-2">Error Details:</p>
        <p>{error.message || 'No error message provided'}</p>
        {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
        {error.stack && <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
