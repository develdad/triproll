import Link from "next/link";

/** Branded 404. */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🧭</div>
        <h1 className="text-2xl font-semibold text-charcoal mb-2">
          No destination here
        </h1>
        <p className="text-slate mb-6">
          This page isn&apos;t on the map. Let&apos;s get you back to somewhere
          worth going.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-3 rounded-lg bg-teal-deep text-white font-semibold hover:bg-ocean transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
