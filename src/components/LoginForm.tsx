"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const searchParams = useSearchParams();
  const isEmail = identifier.includes("@");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "reset_failed") {
      setError("Password reset link is invalid or expired. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    let email: string;

    if (isEmail) {
      // Owner login with real email
      email = identifier;
    } else {
      // Staff login with synthetic email
      if (!orgSlug.trim()) {
        setError("Please enter your organization identifier");
        setLoading(false);
        return;
      }
      email = `${identifier}@${orgSlug}.staff.hilt`;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/d/select-role";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Log in</h1>
      <p className="text-sm text-slate">
        Owners: use your email. Staff: use your username.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Email or Username
        </label>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="sarah@clinic.com or jsmith"
        />
      </div>

      {!isEmail && identifier.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Organization Identifier
          </label>
          <input
            type="text"
            required
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder="smith-clinic-a1b2"
          />
          <p className="mt-1 text-xs text-ash">
            Ask your clinic owner for this identifier.
          </p>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink">
            Password
          </label>
          {isEmail && (
            <button
              type="button"
              disabled={resetLoading}
              onClick={async () => {
                if (!identifier.trim()) {
                  setError("Enter your email first, then click Forgot password.");
                  return;
                }
                setResetLoading(true);
                setError("");
                const supabase = createClient();
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
                  redirectTo: window.location.origin + "/auth/callback?next=/update-password",
                });
                setResetLoading(false);
                if (resetError) {
                  setError("Could not send reset email. Please try again.");
                } else {
                  setResetSent(true);
                }
              }}
              className="text-xs text-hilt-blue hover:underline disabled:opacity-50"
            >
              {resetLoading ? "Sending..." : "Forgot password?"}
            </button>
          )}
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
        />
        {resetSent && (
          <p className="mt-1 text-xs text-green-600">
            Password reset email sent. Check your inbox.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>

      <p className="text-center text-sm text-slate">
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="font-medium text-hilt-blue hover:underline"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
