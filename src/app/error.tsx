"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error boundary. Catches unhandled errors in any route segment so the
 * user sees a branded recovery screen instead of a white crash page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in Vercel logs; swap for a real reporter (e.g. Sentry) later.
    console.error("[TripRoll] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-2xl font-semibold text-charcoal mb-2">
          That spin didn&apos;t land
        </h1>
        <p className="text-slate mb-6">
          Something went sideways on our end. Give it another go, and if it keeps
          happening we&apos;re on it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-3 rounded-lg bg-teal-deep text-white font-semibold hover:bg-ocean transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-3 rounded-lg border border-silver/40 text-charcoal font-semibold hover:bg-white transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
