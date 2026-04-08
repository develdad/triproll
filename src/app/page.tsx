"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";
import TripCard from "@/components/TripCard";
import type { GlobeDestination } from "@/components/Globe";

// Dynamic import for Three.js (SSR breaks WebGL)
const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-teal-light border-t-teal-deep rounded-full animate-spin" />
    </div>
  ),
});

export default function Home() {
  const [revealedDest, setRevealedDest] = useState<GlobeDestination>(null);

  const handleDestinationRevealed = useCallback((dest: GlobeDestination) => {
    setRevealedDest(dest);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-cloud">
      <Navbar />

      {/* ---- Hero Section ---- */}
      <section className="relative flex-1 min-h-screen flex items-center pt-16">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ocean via-teal-deep to-charcoal" />

        {/* Content grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6 text-center lg:text-left py-12 lg:py-0">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-white leading-tight">
              Spin the Globe.
              <br />
              <span className="text-peach-light">Get a Trip.</span>
            </h1>
            <p className="text-lg text-teal-light/90 max-w-lg mx-auto lg:mx-0">
              TripRoll delivers complete, personalized travel packages within
              your budget. No planning. No stress. Just spin and go.
            </p>

            {/* Value props */}
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-white/80">
              {[
                { icon: "\u{1F30D}", text: "Complete trip packages" },
                { icon: "\u{1F4B0}", text: "Stay within budget" },
                { icon: "\u26A1", text: "Book in minutes" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Waitlist (hero version) */}
            <div className="mt-2">
              <WaitlistForm />
            </div>
          </div>

          {/* Right: Globe + Trip Card */}
          <div className="relative h-[500px] sm:h-[550px] lg:h-[600px]">
            <Globe onDestinationRevealed={handleDestinationRevealed} />

            {/* Trip card overlay */}
            {revealedDest && (
              <div className="absolute top-4 right-4 z-20">
                <TripCard destination={revealedDest} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section
        id="how-it-works"
        className="py-20 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display text-charcoal text-center mb-4">
            How TripRoll Works
          </h2>
          <p className="text-slate text-center mb-14 max-w-2xl mx-auto">
            Three steps. That is all it takes to go from &quot;I want a trip&quot; to
            a complete travel package ready to book.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Tell Us About You",
                description:
                  "Create your traveler profile: preferences, budget range, travel style, group size, and anything you want to avoid. Takes under 3 minutes.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Spin the Globe",
                description:
                  "Set your dates and budget for this trip, then roll the globe. Watch it spin and land on your destination. Flights, hotel, activities, all included.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth={1.5} />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Pack and Go",
                description:
                  "Love it? Book it. Everything is confirmed and ready. You can even keep the destination a surprise until departure day.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-peach-pale flex items-center justify-center text-teal-deep mb-5">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-peach tracking-widest uppercase mb-2">
                  Step {item.step}
                </span>
                <h3 className="text-xl font-semibold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-slate text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features Grid ---- */}
      <section className="py-20 px-6 bg-cloud">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display text-charcoal text-center mb-14">
            Everything Handled
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Flights", desc: "Round-trip airfare matched to your schedule and preferences.", color: "bg-teal-deep" },
              { title: "Accommodations", desc: "Hotels and stays curated to your comfort level and budget.", color: "bg-teal-bright" },
              { title: "Activities", desc: "Curated experiences, tours, and attractions at your destination.", color: "bg-peach" },
              { title: "Dining", desc: "Restaurant recommendations and reservations when available.", color: "bg-coral" },
              { title: "Transportation", desc: "Rental cars, transfers, or transit passes as needed.", color: "bg-ocean" },
              { title: "Surprise Option", desc: "Keep your destination secret until departure day.", color: "bg-teal-deep" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-silver/20 hover:shadow-lg hover:border-teal-light/50 transition-all"
              >
                <div
                  className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center text-white text-lg font-bold mb-4`}
                >
                  {feature.title[0]}
                </div>
                <h3 className="text-lg font-semibold text-charcoal mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Waitlist CTA ---- */}
      <section
        id="waitlist"
        className="py-20 px-6 bg-gradient-to-r from-teal-deep to-ocean text-white"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display mb-4">
            Be First to Roll
          </h2>
          <p className="text-teal-light/90 mb-8 text-lg">
            Join the waitlist for early access. Founding members get their first
            trip at a reduced service fee.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
