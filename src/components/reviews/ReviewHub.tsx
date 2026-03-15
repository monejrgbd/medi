"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchReviewHub } from "@/app/(dashboard)/d/_actions/reviews";
import ReviewStars from "./ReviewStars";
import ReviewPlatformConfig from "./ReviewPlatformConfig";

interface Location {
  id: string;
  name: string;
}

interface Review {
  id: string;
  submitted_at: string;
  patient_name: string;
  doctor_name: string | null;
  rating: number;
  feedback_text: string | null;
  sent_to_external: boolean;
  external_platform: string | null;
}

interface Stats {
  avg_rating: number;
  total_count: number;
  per_doctor: { doctor_name: string; avg_rating: number; count: number }[];
}

interface ReviewHubProps {
  locations: Location[];
  isOwnerOrManager: boolean;
}

export default function ReviewHub({ locations, isOwnerOrManager }: ReviewHubProps) {
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || "");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [cursorTs, setCursorTs] = useState<string | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [tab, setTab] = useState<"reviews" | "config">("reviews");

  const loadReviews = useCallback(async (locationId: string, append = false, pageCursorTs?: string | null, pageCursorId?: string | null) => {
    if (!locationId) return;
    setLoading(true);

    const result = await fetchReviewHub(locationId, {
      rating: ratingFilter || undefined,
      limit: 50,
      cursorTs: pageCursorTs || undefined,
      cursorId: pageCursorId || undefined,
    });

    setLoading(false);

    if (result?.success) {
      const newReviews = result.reviews || [];
      setReviews(append ? (prev) => [...prev, ...newReviews] : newReviews);
      setStats(result.stats || null);
      setHasMore(newReviews.length === 50);
      if (newReviews.length > 0) {
        const last = newReviews[newReviews.length - 1];
        setCursorTs(last.submitted_at);
        setCursorId(last.id);
      }
    }
  }, [ratingFilter]);

  useEffect(() => {
    setCursorTs(null);
    setCursorId(null);
    loadReviews(selectedLocation);
  }, [selectedLocation, ratingFilter, loadReviews]);

  function handleLoadMore() {
    loadReviews(selectedLocation, true, cursorTs, cursorId);
  }

  return (
    <div>
      {/* Location selector */}
      {locations.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab("reviews")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "reviews"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Reviews
        </button>
        {isOwnerOrManager && (
          <button
            onClick={() => setTab("config")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "config"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Platform Settings
          </button>
        )}
      </div>

      {tab === "config" && isOwnerOrManager ? (
        selectedLocation ? (
          <ReviewPlatformConfig locationId={selectedLocation} />
        ) : (
          <p className="text-sm text-slate text-center py-8">Select a location to configure platforms.</p>
        )
      ) : (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500 font-medium uppercase">Avg Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.avg_rating || "—"}
                  </span>
                  {stats.avg_rating > 0 && (
                    <ReviewStars mode="readonly" value={Math.round(stats.avg_rating)} size="sm" />
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500 font-medium uppercase">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_count}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500 font-medium uppercase">Per Doctor</p>
                <div className="mt-1 space-y-1">
                  {stats.per_doctor.length === 0 && (
                    <p className="text-sm text-gray-400">No data</p>
                  )}
                  {stats.per_doctor.slice(0, 3).map((d, i) => (
                    <div key={`${d.doctor_name}-${i}`} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{d.doctor_name}</span>
                      <span className="text-gray-500 shrink-0 ml-2">
                        {d.avg_rating} ({d.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {[null, 5, 4, 3, 2, 1].map((r) => (
              <button
                key={r ?? "all"}
                onClick={() => setRatingFilter(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  ratingFilter === r
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === null ? "All" : `${r} star${r !== 1 ? "s" : ""}`}
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {loading && reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <ReviewStars mode="readonly" value={review.rating} size="sm" />
                      <p className="text-xs text-gray-500 mt-1">
                        {review.patient_name}
                        {review.doctor_name && (
                          <> &middot; Dr. {review.doctor_name}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">
                        {new Date(review.submitted_at).toLocaleDateString()}
                      </p>
                      {review.sent_to_external && review.external_platform && (
                        <span className="inline-block mt-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Sent to {review.external_platform}
                        </span>
                      )}
                    </div>
                  </div>
                  {review.feedback_text && (
                    <p className="text-sm text-gray-700 mt-2">
                      {review.feedback_text}
                    </p>
                  )}
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
