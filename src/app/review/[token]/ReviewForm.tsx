"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReviewStars from "@/components/reviews/ReviewStars";

interface ReviewFormProps {
  token: string;
}

export default function ReviewForm({ token }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [platformRedirect, setPlatformRedirect] = useState<{
    name: string;
    url: string;
  } | null>(null);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("submit_review", {
      p_token: token,
      p_rating: rating,
      p_feedback_text: feedback || null,
    });

    setLoading(false);

    if (rpcError || !data?.success) {
      setError("Something went wrong. Please try again.");
      return;
    }

    if (data.platform_name && data.platform_url) {
      setPlatformRedirect({
        name: data.platform_name,
        url: data.platform_url,
      });
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl text-green-600">&#10003;</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Thank you for your feedback!
        </h2>

        {platformRedirect && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-4">
              Would you also leave a review on{" "}
              <span className="font-semibold capitalize">
                {platformRedirect.name}
              </span>
              ? It helps others find great care.
            </p>
            <a
              href={platformRedirect.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Leave a review on{" "}
              <span className="capitalize">{platformRedirect.name}</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 text-center">
          How was your visit?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Your feedback helps us improve.
        </p>

        <div className="flex justify-center mb-6">
          <ReviewStars
            mode="interactive"
            value={rating}
            onChange={setRating}
            size="lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional feedback{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 2000))}
            placeholder="Tell us about your experience..."
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none resize-none"
          />
          {feedback.length > 1800 && (
            <p className="text-xs text-gray-400 text-right mt-0.5">
              {feedback.length}/2000
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
