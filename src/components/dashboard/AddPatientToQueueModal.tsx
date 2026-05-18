"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { searchPatients } from "@/app/(dashboard)/d/_actions/billing";
import { addPatientToQueue } from "@/app/(dashboard)/d/_actions/doctor";
import { registerWalkIn } from "@/app/(dashboard)/d/_actions/receptionist";
import { DateInput } from "@/components/ui/DateInput";

interface SearchResult {
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  phone: string | null;
  last_visit_date: string | null;
  visit_count: number;
}

interface SimilarPatient {
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  similarity_score?: number;
}

type ActionResult = {
  success: boolean;
  error?: string;
  needs_resolution?: boolean;
  similar?: SimilarPatient[];
  visit_id?: string;
  claimed?: boolean;
  claim_skipped_reason?: string | null;
};

interface AddPatientToQueueModalProps {
  locationId: string;
  role: "doctor" | "owner" | "receptionist";
  onClose: () => void;
  onSuccess?: (result: { visitId?: string; claimed: boolean }) => void;
}

const LANGUAGES = [
  ["en", "English"], ["es", "Spanish"], ["fr", "French"], ["zh", "Chinese"],
  ["ar", "Arabic"], ["hi", "Hindi"], ["pt", "Portuguese"], ["ru", "Russian"],
  ["ko", "Korean"], ["vi", "Vietnamese"],
] as const;

export default function AddPatientToQueueModal({
  locationId,
  role,
  onClose,
  onSuccess,
}: AddPatientToQueueModalProps) {
  const router = useRouter();
  const isReceptionist = role === "receptionist";
  const title = isReceptionist ? "Register walk in" : "Add patient to queue";

  const [step, setStep] = useState<"search" | "new" | "resolve">("search");
  const [query, setQuery] = useState("");
  const [bday, setBday] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");

  const [claim, setClaim] = useState(true);
  const [similar, setSimilar] = useState<SimilarPatient[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string, d: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await searchPatients(q, d || undefined);
    setSearching(false);
    if (res?.success && res.patients) setResults(res.patients as SearchResult[]);
  }, []);

  useEffect(() => {
    if (step !== "search" || picked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, bday), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, bday, step, picked, doSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  function handleResult(res: ActionResult) {
    if (!res.success) {
      const msg =
        res.error === "subscription_inactive"
          ? "Your subscription is inactive, so new visits cannot be added."
          : res.error === "patient_already_active"
            ? "This patient already has an active visit."
            : res.error || "Could not add patient to queue.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (res.needs_resolution) {
      setSimilar(res.similar || []);
      setStep("resolve");
      setError(null);
      return;
    }
    if (res.claim_skipped_reason === "no_staff_account") {
      toast.info(
        "Added to the queue. Owners without a staff account cannot auto claim, so the patient is unclaimed."
      );
    } else {
      toast.success(res.claimed ? "Patient claimed" : "Patient added to queue");
    }
    onSuccess?.({ visitId: res.visit_id, claimed: !!res.claimed });
    router.refresh();
    onClose();
  }

  async function submit(opts: { patientId?: string; forceNew?: boolean }) {
    setSubmitting(true);
    setError(null);

    const base = {
      locationId,
      ...(opts.patientId
        ? { patientId: opts.patientId }
        : {
            firstName,
            lastName,
            birthday: dob,
            sex: sex || undefined,
            phone: phone.trim() || undefined,
            language,
            forceNew: opts.forceNew,
          }),
    };

    const res = (isReceptionist
      ? await registerWalkIn(base)
      : await addPatientToQueue({ ...base, claim })) as ActionResult;

    setSubmitting(false);
    handleResult(res);
  }

  function submitNew(forceNew: boolean) {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!dob) {
      setError("Date of birth is required.");
      return;
    }
    submit({ forceNew });
  }

  const showClaimToggle = !isReceptionist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-ash hover:text-ink disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* ── Search step ── */}
          {step === "search" && !picked && (
            <>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search patients by name..."
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  aria-label="Search patients"
                />
                <DateInput
                  value={bday}
                  onChange={(e) => setBday(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  aria-label="Filter by date of birth"
                />
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-gray-100">
                {searching ? (
                  <div className="p-4 text-center text-sm text-slate">Searching...</div>
                ) : query.trim().length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate">
                    Type a name to find an existing patient.
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate">No patients found</div>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.patient_id}
                      onClick={() => {
                        setPicked(p);
                        setError(null);
                      }}
                      className="w-full border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-xs text-slate">
                            DOB: {p.birthday}
                            {p.phone && ` | Phone: ${p.phone}`}
                          </p>
                        </div>
                        <p className="text-xs text-slate">{p.visit_count} visits</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setStep("new");
                  setError(null);
                }}
                className="mt-3 text-sm font-medium text-hilt-blue hover:text-blue-700"
              >
                Patient not found? Add a new patient
              </button>
            </>
          )}

          {/* ── Confirm an existing pick ── */}
          {step === "search" && picked && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">
                Selected patient
              </p>
              <div className="mt-1 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-ink">
                  {picked.first_name} {picked.last_name}
                </p>
                <p className="text-xs text-slate">DOB: {picked.birthday}</p>
              </div>

              {showClaimToggle && (
                <label className="mt-4 flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={claim}
                    onChange={(e) => setClaim(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                  />
                  Claim to me immediately
                </label>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setPicked(null)}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => submit({ patientId: picked.patient_id })}
                  disabled={submitting}
                  className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add to queue"}
                </button>
              </div>
            </div>
          )}

          {/* ── New patient step ── */}
          {step === "new" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">First name</label>
                  <input
                    autoFocus
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">Date of birth</label>
                  <DateInput
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15551234567"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
                  >
                    {LANGUAGES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showClaimToggle && (
                <label className="flex items-center gap-2 pt-1 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={claim}
                    onChange={(e) => setClaim(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                  />
                  Claim to me immediately
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setStep("search");
                    setError(null);
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
                >
                  Back to search
                </button>
                <button
                  onClick={() => submitNew(false)}
                  disabled={submitting}
                  className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add to queue"}
                </button>
              </div>
            </div>
          )}

          {/* ── Resolve duplicate step ── */}
          {step === "resolve" && (
            <div>
              <p className="text-sm text-ink">
                We found patients who may be the same person. Pick one, or create a new
                record.
              </p>
              <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-gray-100">
                {similar.map((s) => (
                  <button
                    key={s.patient_id}
                    onClick={() => submit({ patientId: s.patient_id })}
                    disabled={submitting}
                    className="w-full border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-ink">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-slate">DOB: {s.birthday}</p>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setStep("new");
                    setError(null);
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => submitNew(true)}
                  disabled={submitting}
                  className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Create new patient anyway"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
