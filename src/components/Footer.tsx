"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-charcoal text-silver text-sm border-t border-silver/10">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center mb-3 hover:opacity-80 transition-opacity">
              <img
                src="/logo-mini.png"
                alt="TripRoll"
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-silver/70 text-xs">Spin the globe. Get a trip.</p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wide">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  Destinations
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/" className="text-silver/70 hover:text-teal-light transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wide">Follow</h4>
            <ul className="space-y-2 flex gap-3">
              <li>
                <a href="#" className="text-silver/70 hover:text-teal-light transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-silver/70 hover:text-teal-light transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-silver/70 hover:text-teal-light transition-colors">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-silver/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-silver/70 text-xs">
            &copy; 2026 TripRoll, Inc. All rights reserved.
          </p>
          <p className="text-silver/70 text-xs">
            Built with love for spontaneous travelers.
          </p>
        </div>
      </div>
    </footer>
  );
}
