import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign Up - TripRoll",
  description: "Create a new TripRoll account",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-display text-charcoal mb-2">
          Start Your Journey
        </h1>
        <p className="text-slate text-sm">
          Create an account to begin discovering amazing trips.
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-slate py-8">Loading...</div>}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
