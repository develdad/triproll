"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.push(redirectTo);
        router.refresh();
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
          },
        });
        if (authError) throw authError;
        setMessage("Check your email for a confirmation link to complete sign up.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name (Sign Up Only) */}
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-charcoal mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent transition-all"
          />
        </div>

        {/* Confirm Password (Sign Up) */}
        {mode === "signup" && (
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-charcoal mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-silver/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="p-3 rounded-lg bg-mint/10 border border-mint/30 text-teal-deep text-sm">
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-teal-deep to-ocean text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-silver/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate">or</span>
          </div>
        </div>

        {/* Social Auth */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-silver/30 rounded-lg hover:bg-cloud transition-colors font-semibold text-charcoal flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-silver/30 rounded-lg hover:bg-cloud transition-colors font-semibold text-charcoal flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continue with Apple
          </button>
        </div>
      </form>

      {/* Toggle auth mode */}
      <div className="mt-6 text-center text-sm text-slate">
        {mode === "login" ? (
          <>
            Do not have an account?{" "}
            <Link href="/signup" className="text-teal-deep hover:text-teal-bright font-semibold transition-colors">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-teal-deep hover:text-teal-bright font-semibold transition-colors">
              Log in
            </Link>
          </>
        )}
      </div>

      {mode === "login" && (
        <div className="mt-4 text-center text-sm">
          <a href="#" className="text-teal-deep hover:text-teal-bright font-semibold transition-colors">
            Forgot password?
          </a>
        </div>
      )}
    </div>
  );
}
