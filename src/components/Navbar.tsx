"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  // Initials for avatar
  const initials = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-silver/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img
            src="/logo-mini.png"
            alt="TripRoll"
            className="h-9 sm:h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/#how-it-works" className="text-sm text-slate hover:text-teal-deep transition-colors">
            How It Works
          </a>
          <a href="/" className="text-sm text-slate hover:text-teal-deep transition-colors">
            Explore
          </a>
          <a href="/" className="text-sm text-slate hover:text-teal-deep transition-colors">
            Pricing
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-slate hover:text-teal-deep transition-colors"
              >
                My Trips
              </Link>
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-deep to-teal-bright text-white font-semibold text-sm flex items-center justify-center hover:shadow-md transition-shadow">
                  {initials}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-silver/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                  <div className="px-4 py-2 text-xs text-slate border-b border-silver/10 truncate">
                    {user.email}
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-charcoal hover:bg-cloud transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/travel-dna"
                    className="block px-4 py-2 text-sm text-charcoal hover:bg-cloud transition-colors"
                  >
                    Travel DNA
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-peach-pale/50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-teal-deep border border-teal-deep px-4 py-2 rounded-full hover:bg-teal-deep hover:text-white transition-all"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-teal-deep text-white px-4 py-2 rounded-full hover:bg-ocean transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-charcoal hover:text-teal-deep transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-silver/20 bg-white">
          <div className="px-6 py-4 space-y-3">
            <a href="/#how-it-works" className="block text-sm text-slate hover:text-teal-deep transition-colors py-2">
              How It Works
            </a>
            <a href="/" className="block text-sm text-slate hover:text-teal-deep transition-colors py-2">
              Explore
            </a>
            <a href="/" className="block text-sm text-slate hover:text-teal-deep transition-colors py-2">
              Pricing
            </a>
            <div className="border-t border-silver/20 pt-3 space-y-2">
              {user ? (
                <>
                  <div className="text-xs text-slate truncate px-2 pb-1">{user.email}</div>
                  <Link
                    href="/dashboard"
                    className="block text-sm text-charcoal px-4 py-2 rounded-lg hover:bg-cloud transition-colors"
                  >
                    My Trips
                  </Link>
                  <Link
                    href="/travel-dna"
                    className="block text-sm text-charcoal px-4 py-2 rounded-lg hover:bg-cloud transition-colors"
                  >
                    Travel DNA
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left text-sm text-coral px-4 py-2 rounded-lg hover:bg-peach-pale/50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-sm text-teal-deep border border-teal-deep px-4 py-2 rounded-full hover:bg-teal-deep hover:text-white transition-all text-center"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-sm bg-teal-deep text-white px-4 py-2 rounded-full hover:bg-ocean transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
