import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Log In - TripRoll",
  description: "Log in to your TripRoll account",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-display text-charcoal mb-2">
          Welcome Back
        </h1>
        <p className="text-slate text-sm">
          Log in to your TripRoll account to continue planning.
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-slate py-8">Loading...</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
