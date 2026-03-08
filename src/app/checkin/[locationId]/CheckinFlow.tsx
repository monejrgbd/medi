"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePatientRealtime } from "@/hooks/usePatientRealtime";
import CheckinForm from "@/components/patient/CheckinForm";
import WaitingApproval from "@/components/patient/WaitingApproval";
import DenialScreen from "@/components/patient/DenialScreen";
import FirstTimerExplainer from "@/components/patient/FirstTimerExplainer";
import LanguagePicker from "@/components/patient/LanguagePicker";

type FlowState =
  | "inactive"
  | "form"
  | "submitting"
  | "waiting"
  | "denied"
  | "first_timer"
  | "language"
  | "approved";

interface LocationData {
  active: boolean;
  location_name?: string;
  specialty?: string;
  operating_hours?: Record<string, string> | null;
  org_name?: string;
  logo_url?: string | null;
}

interface CheckinFlowProps {
  locationId: string;
  locationData: LocationData;
}

const STORAGE_KEY = "hilt_session_token";

export default function CheckinFlow({
  locationId,
  locationData,
}: CheckinFlowProps) {
  const [state, setState] = useState<FlowState>(
    locationData.active ? "form" : "inactive"
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [patientFirstName, setPatientFirstName] = useState("");
  const [hasPreviousVisits, setHasPreviousVisits] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);

  // Session recovery on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !locationData.active) return;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_patient_session", {
        p_session_token: saved,
      });

      if (!data?.success) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setSessionToken(saved);
      setPatientFirstName(data.patient_first_name);
      setHasPreviousVisits(data.has_previous_visits);
      setConsentGiven(data.consent_given);

      // Resume at correct state based on visit status
      switch (data.status) {
        case "pending_approval":
          setState("waiting");
          break;
        case "still_answering_ai":
        case "waiting_doctor_claim":
        case "claimed_by_doctor":
          if (!data.has_previous_visits && !data.consent_given) {
            setState("first_timer");
          } else {
            setState("approved");
          }
          break;
        case "left":
          setState("denied");
          break;
        case "completed":
          localStorage.removeItem(STORAGE_KEY);
          setState("form");
          break;
        default:
          setState("form");
      }
    })();
  }, [locationData.active]);

  // Handle realtime status changes
  const handleStatusChange = useCallback(
    (payload: { status: string }) => {
      const { status } = payload;

      if (status === "left") {
        setState("denied");
        return;
      }

      if (status === "still_answering_ai") {
        if (!hasPreviousVisits && !consentGiven) {
          setState("first_timer");
        } else {
          setState("approved");
        }
        return;
      }

      // For any other forward status, go to approved
      if (
        status === "waiting_doctor_claim" ||
        status === "claimed_by_doctor" ||
        status === "completed"
      ) {
        setState("approved");
      }
    },
    [hasPreviousVisits, consentGiven]
  );

  usePatientRealtime(
    state === "waiting" ? sessionToken : null,
    handleStatusChange
  );

  async function handleCheckin(
    firstName: string,
    lastName: string,
    birthday: string
  ) {
    setState("submitting");
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("checkin_patient", {
      p_location_id: locationId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_birthday: birthday,
    });

    setLoading(false);

    if (rpcError || !data?.success) {
      setError(data?.error || rpcError?.message || "Check-in failed.");
      setState("form");
      return;
    }

    setPatientFirstName(firstName);
    setHasPreviousVisits(data.has_previous_visits);

    switch (data.match_type) {
      case "new":
      case "returning":
        setSessionToken(data.session_token);
        localStorage.setItem(STORAGE_KEY, data.session_token);
        setState("waiting");
        break;
      case "active_session":
        setSessionToken(data.session_token);
        localStorage.setItem(STORAGE_KEY, data.session_token);
        // Recover session state
        const { data: session } = await supabase.rpc("get_patient_session", {
          p_session_token: data.session_token,
        });
        if (session?.success) {
          setConsentGiven(session.consent_given);
          if (session.status === "pending_approval") {
            setState("waiting");
          } else if (
            session.status === "still_answering_ai" &&
            !session.has_previous_visits &&
            !session.consent_given
          ) {
            setState("first_timer");
          } else if (session.status === "left") {
            setState("denied");
          } else {
            setState("approved");
          }
        } else {
          setState("waiting");
        }
        break;
      case "phone_required":
        setError(
          "Phone verification is required. This feature is coming soon."
        );
        setState("form");
        break;
      default:
        setState("waiting");
    }
  }

  function handleRetry() {
    localStorage.removeItem(STORAGE_KEY);
    setSessionToken(null);
    setError("");
    setState("form");
  }

  function handleConsentContinue() {
    setState("language");
  }

  async function handleLanguageSelect(language: string) {
    if (!sessionToken) return;

    setLanguageLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "give_patient_consent",
      {
        p_session_token: sessionToken,
        p_language: language,
      }
    );
    setLanguageLoading(false);

    if (rpcError || !data?.success) {
      setError(data?.error || "Failed to save preferences.");
      return;
    }

    setConsentGiven(true);
    setState("approved");
  }

  // Render based on state
  switch (state) {
    case "inactive":
      return (
        <div className="w-full max-w-md text-center">
          {locationData.logo_url && (
            <img
              src={locationData.logo_url}
              alt={locationData.org_name || ""}
              className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
            />
          )}
          <h2 className="text-xl font-bold text-ink mb-2">
            {locationData.location_name || "This Location"}
          </h2>
          <p className="text-sm text-slate mb-4">
            This location is not currently accepting check-ins.
          </p>
          {locationData.operating_hours && (
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-left">
              <p className="text-xs font-medium text-ink mb-2">
                Operating Hours
              </p>
              {Object.entries(locationData.operating_hours).map(
                ([day, hours]) => (
                  <div
                    key={day}
                    className="flex justify-between text-xs text-slate"
                  >
                    <span>{day}</span>
                    <span>{hours}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );

    case "form":
    case "submitting":
      return (
        <CheckinForm
          locationName={locationData.location_name || "Check In"}
          orgName={locationData.org_name || ""}
          logoUrl={locationData.logo_url || null}
          onSubmit={handleCheckin}
          loading={loading}
          error={error}
        />
      );

    case "waiting":
      return (
        <WaitingApproval
          patientFirstName={patientFirstName}
          locationName={locationData.location_name || "the clinic"}
        />
      );

    case "denied":
      return <DenialScreen onRetry={handleRetry} />;

    case "first_timer":
      return <FirstTimerExplainer onContinue={handleConsentContinue} />;

    case "language":
      return (
        <LanguagePicker
          onSelect={handleLanguageSelect}
          loading={languageLoading}
        />
      );

    case "approved":
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <span className="text-3xl text-green-600">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">You're All Set</h2>
          <p className="text-sm text-slate">
            Your conversation will begin shortly — coming in Phase 4.
          </p>
        </div>
      );

    default:
      return null;
  }
}
