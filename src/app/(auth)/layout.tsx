import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-teal-deep flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path
                d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <span className="text-xl font-display text-charcoal">TripRoll</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-silver/20 p-8 sm:p-10">
          {children}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate hover:text-teal-deep transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
