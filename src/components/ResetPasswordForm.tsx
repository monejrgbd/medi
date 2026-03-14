"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: window.location.origin + "/auth/callback?next=/update-password" }
    );

    setLoading(false);

    if (resetError) {
      setError("Could not send reset email. Please try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Check your email</h1>
        <p className="text-sm text-slate">
          If an account exists for <span className="font-medium text-ink">{email}</span>,
          you&apos;ll receive a password reset link shortly.
        </p>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-hilt-blue hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="text-sm text-slate">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="sarah@clinic.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <p className="text-center text-sm text-slate">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-hilt-blue hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
