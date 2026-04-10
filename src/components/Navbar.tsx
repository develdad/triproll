"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-silver/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img
            src="/logo-mini.png"
            alt="TripRoll"
            className="h-9 sm:h-10 w-auto"
            style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(96%) saturate(1044%) hue-rotate(156deg) brightness(92%) contrast(97%)" }}
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
          <Link
            href="/auth/login"
            className="text-sm text-teal-deep border border-teal-deep px-4 py-2 rounded-full hover:bg-teal-deep hover:text-white transition-all"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-teal-deep text-white px-4 py-2 rounded-full hover:bg-ocean transition-colors"
          >
            Sign Up
          </Link>
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
              <Link
                href="/auth/login"
                className="block text-sm text-teal-deep border border-teal-deep px-4 py-2 rounded-full hover:bg-teal-deep hover:text-white transition-all text-center"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="block text-sm bg-teal-deep text-white px-4 py-2 rounded-full hover:bg-ocean transition-colors text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
