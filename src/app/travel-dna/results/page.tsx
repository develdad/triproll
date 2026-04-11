import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveTravelDNA } from "@/app/actions";
import { ARCHETYPE_DESCRIPTIONS } from "@/lib/constants";
import type { TravelDNAArchetype } from "@/lib/types";
import RadarChart from "@/components/RadarChart";

export const metadata = {
  title: "Your Travel DNA Results - TripRoll",
  description: "View your Travel DNA personality profile and radar chart",
};

export default async function TravelDNAResultsPage() {
  const dna = await getActiveTravelDNA();

  if (!dna) {
    redirect("/travel-dna");
  }

  const archetype = dna.archetype as TravelDNAArchetype;
  const archetypeInfo = ARCHETYPE_DESCRIPTIONS[archetype];

  const axes = {
    adventure: dna.adventure as number,
    social: dna.social as number,
    structure: dna.structure as number,
    cultural: dna.cultural as number,
    budget: dna.budget as number,
    energy: dna.energy as number,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-2">
            Your Travel DNA
          </h1>
          <p className="text-slate text-lg">
            Here is your travel personality profile based on your quiz results.
          </p>
        </div>

        {/* Archetype Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-silver/20 overflow-hidden mb-10">
          <div className={`${archetypeInfo.color} h-20 flex items-center justify-center`}>
            <span className="text-5xl">{archetypeInfo.icon}</span>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-teal-deep mb-4">
              {archetype}
            </h2>
            <p className="text-lg text-slate leading-relaxed max-w-xl mx-auto">
              {archetypeInfo.description}
            </p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-silver/20 p-6 sm:p-10 mb-10">
          <h3 className="text-xl font-semibold text-charcoal text-center mb-6">
            Personality Breakdown
          </h3>
          <RadarChart axes={axes} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/trip/new"
            className="bg-teal-deep hover:bg-ocean text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Plan a Trip
          </Link>
          <Link
            href="/travel-dna"
            className="border border-teal-deep text-teal-deep hover:bg-teal-light/10 font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Retake Quiz
          </Link>
          <Link
            href="/dashboard"
            className="text-slate hover:text-teal-deep transition-colors text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
