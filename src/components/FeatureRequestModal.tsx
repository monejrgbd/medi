"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FeatureRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "submit_feature_request",
      { p_content: content.trim() }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    if (data && !data.success) {
      setError(data.error || "Failed to submit");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  function handleClose() {
    setContent("");
    setSubmitted(false);
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-ink mb-2">Thank you!</p>
            <p className="text-sm text-slate mb-4">
              Your feature request has been submitted.
            </p>
            <button
              onClick={handleClose}
              className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-ink mb-4">
              Request a Feature
            </h2>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue resize-none"
              placeholder="Describe the feature you'd like to see..."
            />

            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
