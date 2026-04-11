"use client";

import { useState, FormEvent } from "react";
import { joinWaitlist } from "@/app/actions";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const result = await joinWaitlist(email);

    if (result.error) {
      if (result.error.includes("already")) {
        // Treat "already on list" as success, not an error
        setSubmitted(true);
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="animate-fade-in-up text-center py-4">
        <div className="inline-flex items-center gap-2 bg-mint/20 text-teal-deep font-semibold px-6 py-3 rounded-full">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          You are on the list! We will be in touch.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-5 py-3 rounded-full border border-silver/50 bg-white text-charcoal placeholder:text-silver focus:outline-none focus:border-teal-bright focus:ring-2 focus:ring-teal-bright/20 transition-all text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-peach text-white font-semibold rounded-full hover:bg-coral transition-all hover:scale-105 shadow-md shadow-peach/20 disabled:opacity-60 disabled:hover:scale-100 text-sm cursor-pointer whitespace-nowrap"
      >
        {loading ? "Joining..." : "Join the Waitlist"}
      </button>
      {error && (
        <p className="text-coral text-sm mt-2 text-center sm:text-left">{error}</p>
      )}
    </form>
  );
}
