"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUDGET_RANGES, COMMON_DEPARTING_CITIES, CONSTRAINTS_OPTIONS } from "@/lib/constants";
import type { TripRequest, TravelMode } from "@/lib/types";
import { saveTripRequest, getActiveTravelDNA, generateTrip } from "@/app/actions";

export default function TripQuestionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<TripRequest>({
    departureDate: "",
    returnDate: "",
    budgetMin: 1000,
    budgetMax: 2000,
    partySize: 1,
    partyType: "solo",
    departureCity: "",
    travelMode: "flights-included" as TravelMode,
    constraints: {
      dietary: [],
      mobility: [],
      passport: [],
      other: "",
    },
    status: "draft",
    createdAt: new Date().toISOString(),
  });

  const steps = [
    { title: "Travel Dates", icon: "📅" },
    { title: "Budget", icon: "💰" },
    { title: "Travel Party", icon: "👥" },
    { title: "Departure City", icon: "✈️" },
    { title: "Getting There", icon: "🛣️" },
    { title: "Constraints", icon: "🚫" },
    { title: "Review", icon: "✅" },
  ];

  const [dateError, setDateError] = useState<string | null>(null);

  const handleDateChange = (field: "departureDate" | "returnDate", value: string) => {
    setDateError(null);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Validate: return date must be after departure date
      if (updated.departureDate && updated.returnDate) {
        const dep = new Date(updated.departureDate);
        const ret = new Date(updated.returnDate);
        if (ret <= dep) {
          setDateError("Return date must be after your departure date.");
        } else {
          const days = Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
          if (days < 2) {
            setDateError("Trips must be at least 2 nights. Even a quick getaway needs a little breathing room.");
          }
        }
      }

      return updated;
    });
  };

  const handleBudgetChange = (min: number, max: number) => {
    setFormData((prev) => ({ ...prev, budgetMin: min, budgetMax: max }));
  };

  const handlePartyType = (type: "solo" | "couple" | "small-group" | "group") => {
    const partySize = {
      solo: 1,
      couple: 2,
      "small-group": 3,
      group: 5,
    }[type];

    setFormData((prev) => ({
      ...prev,
      partyType: type,
      partySize,
    }));
  };

  const handleConstraintToggle = (category: "dietary" | "mobility" | "passport", value: string) => {
    setFormData((prev) => {
      const current = prev.constraints[category];
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          [category]: current.includes(value)
            ? current.filter((c) => c !== value)
            : [...current, value],
        },
      };
    });
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitted(true);
    setSubmitError(null);

    try {
      // Fetch the user's active Travel DNA from Supabase
      const dna = await getActiveTravelDNA();
      const travelDnaId = dna?.id;

      // Save the trip request
      const result = await saveTripRequest({
        travelDnaId,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        partySize: formData.partySize,
        partyType: formData.partyType,
        departureCity: formData.departureCity,
        constraintsDietary: formData.constraints.dietary,
        constraintsMobility: formData.constraints.mobility,
        constraintsPassport: formData.constraints.passport,
        constraintsOther: formData.constraints.other,
        travelMode: formData.travelMode,
        mode: "commitment",
      });

      if (result.error) {
        setSubmitError(result.error);
        setSubmitted(false);
        return;
      }

      // Generate a trip based on the request + DNA
      const tripResult = await generateTrip(result.data!.id);

      if (tripResult.error || !tripResult.data) {
        // Trip generation failed, but request was saved. Go to dashboard.
        setTimeout(() => router.push("/dashboard"), 2500);
        return;
      }

      // Navigate to the trip detail page
      setTimeout(() => {
        router.push(`/trip/${tripResult.data!.id}`);
      }, 2500);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitted(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (submitted) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud via-white to-teal-light/20 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-2">
            Plan Your Trip
          </h1>
          <p className="text-slate">Help us understand your perfect getaway</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-silver/20 rounded-full h-2 overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-teal-deep to-teal-bright h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate">
            <span>{step + 1} of {steps.length}</span>
            <span>{steps[step].title}</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i === step
                  ? "bg-teal-deep text-white"
                  : i < step
                  ? "bg-teal-light text-teal-deep"
                  : "bg-silver/20 text-slate"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-silver/20 p-8 mb-6">
          {/* Step 1: Dates */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">When are you planning to travel?</h2>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Departure Date</label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleDateChange("departureDate", e.target.value)}
                  className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Return Date</label>
                <input
                  type="date"
                  value={formData.returnDate}
                  min={formData.departureDate || undefined}
                  onChange={(e) => handleDateChange("returnDate", e.target.value)}
                  className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent"
                />
              </div>

              {dateError && (
                <div className="p-3 rounded-lg bg-peach/10 border border-peach/30 text-sm text-coral">
                  {dateError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">What is your budget per person?</h2>

              <div className="space-y-3">
                {BUDGET_RANGES.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => handleBudgetChange(range.min, range.max)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      formData.budgetMin === range.min && formData.budgetMax === range.max
                        ? "border-teal-deep bg-teal-light/20"
                        : "border-silver/30 hover:border-teal-light"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-charcoal">{range.label}</div>
                      <div className="text-sm text-slate">
                        ${range.min.toLocaleString()} - ${range.max.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-2xl">{range.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Party Size */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">Who are you traveling with?</h2>

              <div className="space-y-3">
                {[
                  { type: "solo", label: "Solo", emoji: "🧑" },
                  { type: "couple", label: "Couple", emoji: "👫" },
                  { type: "small-group", label: "Small Group (3-4)", emoji: "👥" },
                  { type: "group", label: "Group (5+)", emoji: "👨-👩-👧-👦" },
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handlePartyType(option.type as any)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      formData.partyType === option.type
                        ? "border-teal-deep bg-teal-light/20"
                        : "border-silver/30 hover:border-teal-light"
                    }`}
                  >
                    <div className="font-semibold text-charcoal">{option.label}</div>
                    <span className="text-2xl">{option.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Departure City */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">Where are you departing from?</h2>

              <div>
                <input
                  type="text"
                  placeholder="Type your city..."
                  value={formData.departureCity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, departureCity: e.target.value }))}
                  className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent mb-4"
                />

                <div className="space-y-2">
                  {COMMON_DEPARTING_CITIES.filter((city) =>
                    city.toLowerCase().includes(formData.departureCity.toLowerCase())
                  ).map((city) => (
                    <button
                      key={city}
                      onClick={() => setFormData((prev) => ({ ...prev, departureCity: city }))}
                      className="w-full p-3 text-left rounded-lg hover:bg-teal-light/20 transition-colors border border-transparent hover:border-teal-light/50"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Getting There */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-2">How would you like to get there?</h2>
              <p className="text-slate text-sm mb-6">This shapes which destinations we can match you with and what we include in your package.</p>

              <div className="space-y-3">
                {([
                  {
                    mode: "flights-included" as TravelMode,
                    label: "Book my flights",
                    description: "We handle everything, including round-trip airfare to your destination.",
                    icon: "✈️",
                  },
                  {
                    mode: "arrange-own-flights" as TravelMode,
                    label: "I'll arrange my own flights",
                    description: "We plan your destination, accommodation, and activities. You book your own travel to get there.",
                    icon: "🎫",
                  },
                  {
                    mode: "road-trip" as TravelMode,
                    label: "Road trip",
                    description: "We find a drivable destination and plan everything on the ground. You hit the road.",
                    icon: "🚗",
                  },
                ]).map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => setFormData((prev) => ({ ...prev, travelMode: option.mode }))}
                    className={`w-full p-5 rounded-lg border-2 transition-all text-left ${
                      formData.travelMode === option.mode
                        ? "border-teal-deep bg-teal-light/20"
                        : "border-silver/30 hover:border-teal-light"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-0.5">{option.icon}</span>
                      <div>
                        <div className="font-semibold text-charcoal">{option.label}</div>
                        <div className="text-sm text-slate mt-1">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.travelMode === "road-trip" && (
                <div className="p-3 rounded-lg bg-cloud border border-silver/20 text-sm text-slate">
                  Destinations will be limited to places within driving distance of {formData.departureCity || "your departure city"}, scaled to your trip length.
                </div>
              )}
            </div>
          )}

          {/* Step 6: Constraints */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">Any constraints we should know about?</h2>

              <div>
                <h3 className="font-semibold text-charcoal mb-3">Dietary Restrictions</h3>
                <div className="space-y-2">
                  {CONSTRAINTS_OPTIONS.dietary.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.constraints.dietary.includes(option)}
                        onChange={() => handleConstraintToggle("dietary", option)}
                        className="w-4 h-4 rounded accent-teal-deep"
                      />
                      <span className="text-slate">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-charcoal mb-3">Accessibility Needs</h3>
                <div className="space-y-2">
                  {CONSTRAINTS_OPTIONS.mobility.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.constraints.mobility.includes(option)}
                        onChange={() => handleConstraintToggle("mobility", option)}
                        className="w-4 h-4 rounded accent-teal-deep"
                      />
                      <span className="text-slate">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-charcoal mb-3">Other Constraints</h3>
                <textarea
                  value={formData.constraints.other}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    constraints: { ...prev.constraints, other: e.target.value },
                  }))}
                  placeholder="Any other preferences or requirements..."
                  className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-charcoal mb-6">Review Your Details</h2>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-cloud">
                  <div className="text-sm text-slate mb-1">Travel Dates</div>
                  <div className="font-semibold text-charcoal">
                    {formData.departureDate} to {formData.returnDate}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <div className="text-sm text-slate mb-1">Budget</div>
                  <div className="font-semibold text-charcoal">
                    ${formData.budgetMin.toLocaleString()} - ${formData.budgetMax.toLocaleString()} per person
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <div className="text-sm text-slate mb-1">Travel Party</div>
                  <div className="font-semibold text-charcoal">
                    {formData.partyType} ({formData.partySize} person)
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <div className="text-sm text-slate mb-1">Departure City</div>
                  <div className="font-semibold text-charcoal">{formData.departureCity}</div>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <div className="text-sm text-slate mb-1">Getting There</div>
                  <div className="font-semibold text-charcoal">
                    {formData.travelMode === "flights-included" && "Flights included in package"}
                    {formData.travelMode === "arrange-own-flights" && "Arranging own flights"}
                    {formData.travelMode === "road-trip" && "Road trip (driving)"}
                  </div>
                </div>

                {(formData.constraints.dietary.length > 0 ||
                  formData.constraints.mobility.length > 0 ||
                  formData.constraints.other) && (
                  <div className="p-4 rounded-lg bg-cloud">
                    <div className="text-sm text-slate mb-2">Constraints</div>
                    <div className="text-sm text-charcoal space-y-1">
                      {formData.constraints.dietary.length > 0 && (
                        <div>Dietary: {formData.constraints.dietary.join(", ")}</div>
                      )}
                      {formData.constraints.mobility.length > 0 && (
                        <div>Accessibility: {formData.constraints.mobility.join(", ")}</div>
                      )}
                      {formData.constraints.other && <div>{formData.constraints.other}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 border border-teal-deep text-teal-deep rounded-lg hover:bg-teal-light/10 transition-colors font-semibold"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && (!formData.departureDate || !formData.returnDate || !!dateError)) ||
                (step === 3 && !formData.departureCity)
              }
              className="flex-1 px-6 py-3 bg-teal-deep text-white rounded-lg hover:bg-ocean transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-deep to-ocean text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Get My Trip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
