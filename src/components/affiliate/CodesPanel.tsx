"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CodesPanel() {
  const [code, setCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);

  useEffect(() => {
    void loadCode();
  }, []);

  async function loadCode() {
    const supabase = createClient();
    const { data } = await supabase.rpc("partner_create_affiliate_code", { p_force_replace: false });
    if (data?.success) {
      setCode(data.code);
      setLoadError(null);
    } else {
      setLoadError(
        data?.error === "partner_not_active"
          ? "Code generation is paused while your account is under review."
          : data?.error || "Could not load your affiliate code."
      );
    }
  }

  async function regenerate() {
    if (!confirm("Replace your current affiliate code? The old one stays valid for 1 hour for in-flight signups.")) return;
    setGenerating(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("partner_create_affiliate_code", { p_force_replace: true });
    setGenerating(false);
    if (data?.success) setCode(data.code);
  }

  const shareUrl = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?code=${code}` : "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Your affiliate code</h2>
        <p className="mt-1 text-sm text-slate">
          Share this with anyone. Clinics who sign up with it get the standard trial (20 credits, no time limit) and you earn 30% of every payment they make, forever.
        </p>
        {code ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xl font-bold tracking-widest">
                {code}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="rounded-lg bg-hilt-blue px-4 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
              >
                Copy code
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 truncate rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate">
                {shareUrl}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Copy link
              </button>
            </div>
            <button
              onClick={regenerate}
              disabled={generating}
              className="text-xs text-slate hover:text-ink hover:underline disabled:opacity-50"
            >
              {generating ? "Regenerating…" : "Regenerate (replaces current code; 1h grace for in-flight signups)"}
            </button>
          </div>
        ) : loadError ? (
          <p className="mt-4 text-sm text-rose-700">{loadError}</p>
        ) : (
          <p className="mt-4 text-sm text-slate">Loading…</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Premium trial code</h2>
            <p className="mt-1 text-sm text-slate">
              Targeted at a specific clinic. We email them an 8 character code that grants the bigger trial (200 credits, no time limit). You get attribution.
            </p>
          </div>
          <button
            onClick={() => setTrialOpen(!trialOpen)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {trialOpen ? "Close" : "Send a trial"}
          </button>
        </div>
        {trialOpen && <PremiumTrialForm onSent={() => setTrialOpen(false)} />}
      </div>
    </div>
  );
}

function PremiumTrialForm({ onSent }: { onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; code?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setResult({ ok: false, msg: "You must confirm permission." });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("partner_create_premium_trial_code", {
      p_target_email: email || null,
      p_target_domain: domain || null,
      p_target_phone: null,
      p_consent_to_email: consent,
    });
    setLoading(false);
    if (error || (data && !data.success)) {
      setResult({ ok: false, msg: error?.message || data?.error || "Failed to send" });
      return;
    }
    if (data.claimed) {
      setResult({
        ok: true,
        code: data.code,
        msg: data.already_emailed
          ? `This clinic already had a code in their inbox. They are now attributed to you. Code: ${data.code}`
          : `You claimed an existing application. Code emailing under your name. Code: ${data.code}`,
      });
    } else {
      setResult({
        ok: true,
        code: data.code,
        msg: `Code generated and queued for delivery in 5–15 minutes. Code: ${data.code}`,
      });
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 border-t border-gray-100 pt-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Clinic email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="contact@clinic.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Custom domain (optional)</label>
        <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="clinic.com" />
        <p className="mt-1 text-xs text-slate">If provided, locks this clinic to one premium trial total.</p>
      </div>
      <label className="flex items-start gap-2 text-xs text-slate">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-hilt-blue" />
        <span>I have permission to email this clinic about Hilt Health.</span>
      </label>
      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {result.msg}
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50">
          {loading ? "Sending…" : "Send trial code"}
        </button>
        <button type="button" onClick={onSent}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
          Close
        </button>
      </div>
    </form>
  );
}
