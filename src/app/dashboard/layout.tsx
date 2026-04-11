"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/trip/new", label: "New Trip" },
    { href: "/travel-dna", label: "Travel DNA" },
    { href: "/travel-dna/results", label: "DNA Results", indent: true },
  ];

  return (
    <div className="min-h-screen bg-cloud">
      {/* Shared site-wide navbar */}
      <Navbar />

      <div className="flex pt-[72px]">
        {/* Sidebar */}
        <aside
          className={`fixed top-[72px] bottom-0 left-0 w-64 bg-white border-r border-silver/20 transition-transform duration-300 z-40 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6 flex flex-col h-full">
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      item.indent ? "pl-8 text-sm" : ""
                    } ${
                      isActive
                        ? "bg-teal-light/20 text-teal-deep font-semibold"
                        : "text-slate hover:bg-cloud"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Mobile sidebar toggle */}
          <div className="lg:hidden sticky top-[72px] z-30 bg-white border-b border-silver/20 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-cloud transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
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
    </div>
  );
}
