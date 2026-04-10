"use client";

import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cloud">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-silver/20 transition-transform duration-300 z-40 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
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
            <span className="font-display text-charcoal">TripRoll</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            <Link
              href="/dashboard"
              className="block px-4 py-3 rounded-lg bg-teal-light/20 text-teal-deep font-semibold hover:bg-teal-light/30 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/trip/new"
              className="block px-4 py-3 rounded-lg text-slate hover:bg-cloud transition-colors"
            >
              New Trip
            </Link>
            <Link
              href="/travel-dna"
              className="block px-4 py-3 rounded-lg text-slate hover:bg-cloud transition-colors"
            >
              Travel DNA
            </Link>
            <Link
              href="/travel-dna/results"
              className="block px-4 py-3 rounded-lg text-slate hover:bg-cloud transition-colors pl-8 text-sm"
            >
              View Results
            </Link>
          </nav>

          {/* User Actions */}
          <div className="space-y-2 border-t border-silver/20 pt-6">
            <button className="w-full text-left px-4 py-3 rounded-lg text-slate hover:bg-cloud transition-colors">
              Settings
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg text-slate hover:bg-cloud transition-colors text-coral hover:text-coral">
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Bar */}
        <div className="bg-white border-b border-silver/20 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-2xl font-semibold text-charcoal hidden sm:block">Dashboard</h1>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-cloud transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-deep to-ocean flex items-center justify-center text-white font-semibold">
            U
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
