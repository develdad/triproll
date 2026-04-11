"use client";

import { useSearchParams } from "next/navigation";
import TripQuestionnaire from "@/components/TripQuestionnaire";

export default function TripNewContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-2xl">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-deep to-teal-bright flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-3">
            We are curating your perfect trip!
          </h1>
          <p className="text-lg text-slate mb-8">
            Our AI is analyzing destinations that match your Travel DNA and preferences. You will receive personalized trip options within 24 hours.
          </p>
          <div className="inline-block">
            <div className="flex items-center gap-2 text-teal-deep font-semibold">
              <div className="w-2 h-2 rounded-full bg-teal-deep animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-teal-deep animate-pulse animation-delay-200" />
              <div className="w-2 h-2 rounded-full bg-teal-deep animate-pulse animation-delay-400" />
              Processing...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const destinationId = searchParams.get("destination");
  return <TripQuestionnaire lockedDestinationId={destinationId} />;
}
