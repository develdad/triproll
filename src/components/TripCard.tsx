"use client";

import { useState, useEffect } from "react";
import type { GlobeDestination } from "./Globe";

interface TripCardProps {
  destination: GlobeDestination;
}

export default function TripCard({ destination }: TripCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (destination) {
      // Slight delay for the pin to land first
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [destination]);

  if (!destination || !visible) return null;

  return (
    <div className="animate-fade-in-up bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-teal-light/30 p-6 max-w-sm w-full">
      {/* Destination header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-peach uppercase tracking-wider mb-1">
            Your Destination
          </p>
          <h3 className="text-2xl font-display text-charcoal leading-tight">
            {destination.name}
          </h3>
        </div>
        <span className="bg-teal-deep text-white text-xs font-semibold px-3 py-1 rounded-full">
          {destination.days} nights
        </span>
      </div>

      {/* Trip theme */}
      <div className="bg-peach-pale rounded-lg px-4 py-3 mb-4">
        <p className="text-xs text-slate mb-0.5">Trip Theme</p>
        <p className="text-base font-semibold text-charcoal">
          {destination.theme}
        </p>
      </div>

      {/* Package preview (demo) */}
      <div className="space-y-2 mb-5">
        {[
          { icon: "\u2708", label: "Round-trip flights included" },
          { icon: "\u{1F3E8}", label: "4-star hotel, free cancellation" },
          { icon: "\u{1F3AF}", label: "Curated activities & dining" },
          { icon: "\u{1F697}", label: "Ground transportation arranged" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate">
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <button className="flex-1 bg-teal-deep text-white font-semibold py-2.5 rounded-xl hover:bg-ocean transition-colors text-sm cursor-pointer">
          Book This Trip
        </button>
        <button className="px-4 py-2.5 border border-silver text-slate rounded-xl hover:border-teal-bright hover:text-teal-deep transition-colors text-sm cursor-pointer">
          Details
        </button>
      </div>

      <p className="text-xs text-silver text-center mt-3">
        Demo preview. Real trips coming soon.
      </p>
    </div>
  );
}
