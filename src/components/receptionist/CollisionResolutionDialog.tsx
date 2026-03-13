"use client";

import { useState, useEffect } from "react";
import {
  fetchCollisionState,
  resolveCollision,
  handleNoPhoneExisting,
} from "@/app/(dashboard)/d/_actions/receptionist";

interface CollisionResolutionDialogProps {
  visitId: string;
  onResolved: () => void;
  onCancel: () => void;
}

type MatchState = "phone_matches" | "phone_no_match" | "no_existing_phone";

export default function CollisionResolutionDialog({
  visitId,
  onResolved,
  onCancel,
}: CollisionResolutionDialogProps) {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [existingPhoneMasked, setExistingPhoneMasked] = useState<string | null>(null);
  const [newPhoneMasked, setNewPhoneMasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const result = await fetchCollisionState(visitId);
      if (result.success) {
        setMatchState(result.match_state as MatchState);
        setExistingPhoneMasked(result.existing_phone_masked ?? null);
        setNewPhoneMasked(result.new_phone_masked ?? null);
      } else {
        setError(result.error || "Failed to load collision state");
      }
      setLoading(false);
    })();
  }, [visitId]);

  async function handlePhoneMatchesSamePerson() {
    setActionLoading(true);
    setError("");
    const result = await resolveCollision(visitId, true, false);
    setActionLoading(false);
    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "Failed to resolve collision");
    }
  }

  async function handlePhoneMatchesShared() {
    setActionLoading(true);
    setError("");
    const result = await resolveCollision(visitId, true, true);
    setActionLoading(false);
    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "Shared phone blocked. Handle manually.");
    }
  }

  async function handlePhoneNoMatch() {
    setActionLoading(true);
    setError("");
    const result = await resolveCollision(visitId, false);
    setActionLoading(false);
    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "Failed to resolve collision");
    }
  }

  async function handleNoExistingPhone() {
    setActionLoading(true);
    setError("");
    const result = await handleNoPhoneExisting(visitId);
    setActionLoading(false);
    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "Failed to handle no-phone case");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink mb-4">Collision Resolution</h3>

        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-hilt-blue" />
            <p className="mt-3 text-sm text-slate">Loading collision details...</p>
          </div>
        ) : matchState === "phone_matches" ? (
          <div>
            <p className="text-sm text-slate mb-2">
              The verified phone number <span className="font-medium">{newPhoneMasked}</span> matches
              an existing patient record <span className="font-medium">{existingPhoneMasked}</span>.
            </p>
            <p className="text-sm text-ink font-medium mb-4">
              Is this phone shared with someone who has the same name and date of birth?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePhoneMatchesSamePerson}
                disabled={actionLoading}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "No — Same Person (Approve)"}
              </button>
              <button
                onClick={handlePhoneMatchesShared}
                disabled={actionLoading}
                className="w-full rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:opacity-50"
              >
                Yes — Shared Phone
              </button>
            </div>
          </div>
        ) : matchState === "phone_no_match" ? (
          <div>
            <p className="text-sm text-slate mb-2">
              The verified phone <span className="font-medium">{newPhoneMasked}</span> does NOT match the
              existing record ({existingPhoneMasked}).
            </p>
            <p className="text-sm text-ink font-medium mb-4">
              This is a different person with the same name and birthday. Both records will be flagged for
              future verification.
            </p>
            <button
              onClick={handlePhoneNoMatch}
              disabled={actionLoading}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Confirm — Create Separate Record"}
            </button>
          </div>
        ) : matchState === "no_existing_phone" ? (
          <div>
            <p className="text-sm text-slate mb-2">
              The existing patient record has no phone on file and cannot be verified.
            </p>
            <p className="text-sm text-ink font-medium mb-4">
              The existing record will be archived. A new record will be created with the
              verified phone <span className="font-medium">{newPhoneMasked}</span>.
            </p>
            <button
              onClick={handleNoExistingPhone}
              disabled={actionLoading}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Confirm — Archive & Create New"}
            </button>
          </div>
        ) : null}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-ash mb-3">
            By confirming, you acknowledge that patient identity verification is your responsibility.
            See terms of service.
          </p>
          <button
            onClick={onCancel}
            disabled={actionLoading}
            className="w-full text-sm text-slate hover:text-ink transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
