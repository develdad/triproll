"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TravelDNAAxes, TravelDNAArchetype } from "@/lib/types";
import { TRAVEL_DNA_QUESTIONS, ARCHETYPE_DESCRIPTIONS } from "@/lib/constants";
import { saveTravelDNA } from "@/app/actions";

export default function TravelDNA() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [axes, setAxes] = useState<TravelDNAAxes>({
    adventure: 0,
    social: 0,
    structure: 0,
    cultural: 0,
    budget: 0,
    energy: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  const question = TRAVEL_DNA_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TRAVEL_DNA_QUESTIONS.length) * 100;

  const determineArchetype = (finalAxes: TravelDNAAxes): TravelDNAArchetype => {
    // Score logic based on axes combinations
    const scores: Record<TravelDNAArchetype, number> = {
      "Explorer-Wanderer":
        Math.abs(finalAxes.structure - (-1)) + Math.abs(finalAxes.adventure - 1),
      "Luxury Lounger":
        Math.abs(finalAxes.budget - 1) + Math.abs(finalAxes.adventure - (-1)),
      "Culture Seeker":
        Math.abs(finalAxes.cultural - 1) + Math.abs(finalAxes.social - 1),
      "Thrill Chaser":
        Math.abs(finalAxes.adventure - 1) + Math.abs(finalAxes.energy - 1),
      "Mindful Nomad":
        Math.abs(finalAxes.energy - (-1)) + Math.abs(finalAxes.adventure - (-1)),
    };

    let bestArchetype: TravelDNAArchetype = "Explorer-Wanderer";
    let bestScore = Infinity;

    for (const [archetype, score] of Object.entries(scores)) {
      if (score < bestScore) {
        bestScore = score;
        bestArchetype = archetype as TravelDNAArchetype;
      }
    }

    return bestArchetype;
  };

  const archetype = useMemo(() => determineArchetype(axes), [axes]);

  const handleChoice = (value: number) => {
    const newAxes = { ...axes };
    newAxes[question.axis] += value;

    setAxes(newAxes);

    if (currentQuestion === TRAVEL_DNA_QUESTIONS.length - 1) {
      setIsComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (isComplete) {
    const archetypeInfo = ARCHETYPE_DESCRIPTIONS[archetype];

    return (
      <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Result Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-silver/20 overflow-hidden">
            {/* Header with archetype color */}
            <div className={`${archetypeInfo.color} h-24 flex items-center justify-center`}>
              <span className="text-6xl">{archetypeInfo.icon}</span>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 text-center">
              <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-2">
                Your Travel DNA
              </h1>
              <h2 className="text-2xl sm:text-3xl font-semibold text-teal-deep mb-6">
                {archetype}
              </h2>

              <p className="text-lg text-slate leading-relaxed mb-8">
                {archetypeInfo.description}
              </p>

              {/* Axes Breakdown */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-cloud rounded-lg p-4">
                  <div className="text-sm text-slate mb-2">Adventure</div>
                  <div className="text-2xl font-semibold text-teal-deep">
                    {axes.adventure > 0 ? "🏔️" : "🛋️"}
                  </div>
                </div>
                <div className="bg-cloud rounded-lg p-4">
                  <div className="text-sm text-slate mb-2">Social</div>
                  <div className="text-2xl font-semibold text-teal-deep">
                    {axes.social > 0 ? "👥" : "🤐"}
                  </div>
                </div>
                <div className="bg-cloud rounded-lg p-4">
                  <div className="text-sm text-slate mb-2">Structure</div>
                  <div className="text-2xl font-semibold text-teal-deep">
                    {axes.structure > 0 ? "📋" : "🗺️"}
                  </div>
                </div>
                <div className="bg-cloud rounded-lg p-4">
                  <div className="text-sm text-slate mb-2">Energy</div>
                  <div className="text-2xl font-semibold text-teal-deep">
                    {axes.energy > 0 ? "⚡" : "⭐"}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={async () => {
                  // Persist to database via server action
                  const result = await saveTravelDNA({ ...axes, archetype });
                  // Also store in session storage as fallback
                  sessionStorage.setItem(
                    "travelDNA",
                    JSON.stringify({
                      id: result.data?.id,
                      axes,
                      archetype,
                      completedAt: new Date().toISOString(),
                    })
                  );
                  router.push("/trip/new");
                }}
                className="bg-teal-deep hover:bg-ocean text-white font-semibold px-8 py-3 rounded-full transition-colors inline-block"
              >
                Continue to Trip Details
              </button>
            </div>
          </div>

          {/* Skip Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                router.push("/trip/new");
              }}
              className="text-slate hover:text-teal-deep transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 flex flex-col">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-2">
            Discover Your Travel DNA
          </h1>
          <p className="text-slate text-lg">
            Answer a few quick questions to reveal your travel personality.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-silver/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-deep to-teal-bright h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-sm text-slate mt-3">
          Question {currentQuestion + 1} of {TRAVEL_DNA_QUESTIONS.length}
        </div>
      </div>

      {/* Question Container */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="max-w-3xl w-full">
          <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal text-center mb-12">
            {question.question}
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Option A */}
            <button
              onClick={() => handleChoice(question.optionA.value)}
              className={`group relative rounded-2xl overflow-hidden h-48 sm:h-56 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-deep`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${question.optionA.gradientFrom} ${question.optionA.gradientTo} flex flex-col items-center justify-center p-6 text-white group-hover:shadow-lg transition-all`}
              >
                <div className="text-5xl mb-3">{question.optionA.emoji}</div>
                <div className="text-lg sm:text-xl font-semibold text-center">
                  {question.optionA.label}
                </div>
              </div>
            </button>

            {/* Option B */}
            <button
              onClick={() => handleChoice(question.optionB.value)}
              className={`group relative rounded-2xl overflow-hidden h-48 sm:h-56 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-deep`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${question.optionB.gradientFrom} ${question.optionB.gradientTo} flex flex-col items-center justify-center p-6 text-white group-hover:shadow-lg transition-all`}
              >
                <div className="text-5xl mb-3">{question.optionB.emoji}</div>
                <div className="text-lg sm:text-xl font-semibold text-center">
                  {question.optionB.label}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
