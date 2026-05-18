"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePatientRealtime, RealtimePayload } from "@/hooks/usePatientRealtime";
import { DateInput } from "@/components/ui/DateInput";
import CheckinForm from "@/components/patient/CheckinForm";
import WaitingApproval from "@/components/patient/WaitingApproval";
import DenialScreen from "@/components/patient/DenialScreen";
import FirstTimerExplainer from "@/components/patient/FirstTimerExplainer";
import LanguagePicker from "@/components/patient/LanguagePicker";
import ChatInterface from "@/components/patient/ChatInterface";
import SummaryReview from "@/components/patient/SummaryReview";
import CreditWarning from "@/components/patient/CreditWarning";
import PatientQueueView from "@/components/patient/PatientQueueView";
import ArrivalConfirmScreen from "@/components/patient/ArrivalConfirmScreen";
import DoctorClaimedNotice from "@/components/patient/DoctorClaimedNotice";
import PhoneVerification from "@/components/patient/PhoneVerification";
import PatientLeftScreen from "@/components/patient/PatientLeftScreen";
import VisitCompletedScreen from "@/components/patient/VisitCompletedScreen";
import SubscriptionExpiredScreen from "@/components/patient/SubscriptionExpiredScreen";
import KioskAutoReset from "@/components/patient/KioskAutoReset";
import KioskIdleTimeout from "@/components/patient/KioskIdleTimeout";
import DiscoveryQuestionScreen from "@/components/checkin/DiscoveryQuestionScreen";
import MatchResolution from "@/components/checkin/MatchResolution";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import PreScreeningForm from "@/components/patient/PreScreeningForm";
import { MedicalInfo, PrescreeningConfig } from "@/types/medical";
import { Clock } from "lucide-react";
import { formatQueueNumber } from "@/lib/queueUtils";

type FlowState =
  | "inactive"
  | "form"
  | "submitting"
  | "waiting"
  | "denied"
  | "first_timer"
  | "language"
  | "prescreening"
  | "advance_error"
  | "chatting"
  | "generating_summary"
  | "summary_review"
  | "awaiting_arrival"
  | "queued"
  | "claimed"
  | "timeout"
  | "no_credits"
  | "phone_verification"
  | "match_resolution"
  | "patient_left"
  | "visit_completed"
  | "subscription_inactive"
  | "verify_birthday"
  | "discovery_question";

interface LocationData {
  active: boolean;
  location_name?: string;
  address?: string;
  specialty?: string;
  operating_hours?: Record<string, string> | null;
  org_name?: string;
  logo_url?: string | null;
  ask_referral_source?: boolean;
  ask_discovery_source?: boolean;
  queue_display_enabled?: boolean;
  queue_type?: string;
  prescreening_config?: PrescreeningConfig | null;
}

interface CheckinFlowProps {
  locationId: string;
  locationData: LocationData;
  embed?: boolean;
  kiosk?: boolean;
  demoMode?: boolean;
  teamCode?: string;
  onVisitCreated?: (visitId: string) => void;
  onPhoneComplete?: () => void;
  onPatientReady?: () => void;
}


interface SummaryData {
  summary: string;
  structured_card?: Record<string, unknown> | null;
}

const STORAGE_KEY = "hilt_session_token";
const PHONE_STORAGE_KEY = "hilt_session_phone";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function CheckinFlow({
  locationId,
  locationData,
  embed = false,
  kiosk = false,
  demoMode = false,
  teamCode,
  onVisitCreated,
  onPhoneComplete,
  onPatientReady,
}: CheckinFlowProps) {
  // If URL has ?token=, always start on form (bypass location active check — patient may be at home)
  const hasUrlToken = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("token");
  const [state, setState] = useState<FlowState>(
    (locationData.active || hasUrlToken) ? "form" : "inactive"
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [patientFirstName, setPatientFirstName] = useState("");
  const [hasPreviousVisits, setHasPreviousVisits] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  // Forms-only intake (skip_ai + forms_before_queue): patient fills the
  // prescreening form then goes straight to the queue, no AI chat. Per-visit
  // truth from checkin_patient/checkin_with_token returns + get_patient_session.
  const [aiSkipped, setAiSkipped] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [patientLanguage, setPatientLanguage] = useState("en");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [staffRoom, setStaffRoom] = useState<string | null>(null);
  const [claimerRole, setClaimerRole] = useState<"doctor" | "nurse" | null>(null);

  // Phone verification state
  const [patientPhone, setPatientPhone] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [matchType, setMatchType] = useState<string | null>(null);
  const [formDataForResolve, setFormDataForResolve] = useState<Record<string, unknown> | null>(null);
  const [phoneRetryAt, setPhoneRetryAt] = useState<number | null>(null);
  const [phoneRetryReady, setPhoneRetryReady] = useState(false);
  const [patientSex, setPatientSex] = useState<string | null>(null);
  const [patientBirthday, setPatientBirthday] = useState<string | null>(null);

  // Pre-checkin token (from shared link)
  const [preCheckinToken, setPreCheckinToken] = useState<string | null>(null);
  const [preCheckinName, setPreCheckinName] = useState<{ first: string; last: string } | null>(null);
  const [tokenValidating, setTokenValidating] = useState(false);

  // Birthday verification for session recovery on shared kiosks
  const [pendingSession, setPendingSession] = useState<{
    token: string;
    birthday: string;
    sessionData: Record<string, unknown>;
  } | null>(null);
  const [birthdayInput, setBirthdayInput] = useState("");

  // Refs for current state to avoid stale closures in callbacks
  const summaryDataRef = useRef<SummaryData | null>(null);
  summaryDataRef.current = summaryData;
  const stateRef = useRef<FlowState>(state);
  stateRef.current = state;
  const hasPreviousVisitsRef = useRef(hasPreviousVisits);
  hasPreviousVisitsRef.current = hasPreviousVisits;
  const consentGivenRef = useRef(consentGiven);
  consentGivenRef.current = consentGiven;
  const aiSkippedRef = useRef(aiSkipped);
  aiSkippedRef.current = aiSkipped;
  const demoModeRef = useRef(demoMode);

  function shouldShowPrescreening(): boolean {
    const config = locationData.prescreening_config;
    if (!config) return true; // null = all defaults enabled
    return config.medications_enabled
      || config.allergies_enabled
      || config.pets_enabled
      || config.pregnancy_enabled
      || (config.custom_fields?.length ?? 0) > 0;
  }

  // Stable demo defaults — computed once per mount so they don't change on re-render
  const demoDefaultsRef = useRef(demoMode ? (() => {
    const firsts = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Avery", "Quinn"];
    const lasts = ["Smith", "Johnson", "Lee", "Garcia", "Chen", "Patel", "Kim", "Brown", "Wilson", "Davis"];
    const y = 1985 + Math.floor(Math.random() * 20);
    const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
    const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
    return { firstName: firsts[Math.floor(Math.random() * firsts.length)], lastName: lasts[Math.floor(Math.random() * lasts.length)], birthday: `${y}-${m}-${d}`, sex: Math.random() > 0.5 ? "male" : "female" };
  })() : undefined);

  // Kiosk mode: clear localStorage on mount to prevent session recovery
  useEffect(() => {
    if (!kiosk) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHONE_STORAGE_KEY);
  }, [kiosk]);

  // Auto-send SMS code when entering phone_verification without a verificationId
  useEffect(() => {
    if (state !== "phone_verification") return;
    if (verificationId) return; // Already have a verification in progress
    if (!patientPhone) return;
    handlePhoneSubmit(patientPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, verificationId, patientPhone]);

  // Phone retry timer — 60s after SMS failure
  useEffect(() => {
    if (!phoneRetryAt) {
      setPhoneRetryReady(false);
      return;
    }
    const remaining = phoneRetryAt - Date.now();
    if (remaining <= 0) {
      setPhoneRetryReady(true);
      return;
    }
    const timer = setTimeout(() => setPhoneRetryReady(true), remaining);
    return () => clearTimeout(timer);
  }, [phoneRetryAt]);

  // Notify parent when patient reaches waiting state (phone + discovery done)
  useEffect(() => {
    if (state === "waiting" && onPatientReady) onPatientReady();
  }, [state, onPatientReady]);

  // Summary generation: 45s slow warning + 60s timeout
  const [summaryWarning, setSummaryWarning] = useState(false);

  useEffect(() => {
    if (state !== "generating_summary") return;
    if (!visitId || !sessionToken) return;
    setSummaryWarning(false);

    const warningTimer = setTimeout(() => {
      if (stateRef.current === "generating_summary") {
        setSummaryWarning(true);
      }
    }, 45_000);

    const timer = setTimeout(async () => {
      if (stateRef.current !== "generating_summary") return;

      const supabase = createClient();
      try {
        await supabase.rpc("move_to_queue_on_error", {
          p_visit_id: visitId,
          p_session_token: sessionToken,
        });
      } catch (err) {
        console.error("move_to_queue_on_error failed:", err);
      }

      setState("timeout");
    }, 60_000);

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(timer);
    };
  }, [state, visitId, sessionToken]);

  // Pre-checkin token validation on mount (runs before localStorage recovery)
  useEffect(() => {
    if (kiosk) return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (!urlToken) return;

    setTokenValidating(true);
    const supabase = createClient();
    (async () => {
      const { data, error: rpcError } = await supabase.rpc("validate_pre_checkin_token", {
        p_token: urlToken,
      });

      if (rpcError || !data?.success) {
        // Invalid/expired token — proceed normally
        setTokenValidating(false);
        return;
      }

      // Check location_id matches
      if (data.location_id && data.location_id !== locationId) {
        setTokenValidating(false);
        return;
      }

      if (data.used && data.session_token) {
        // Token already used, active visit — recover session without birthday check
        localStorage.setItem(STORAGE_KEY, data.session_token);
        setSessionToken(data.session_token);

        const { data: session } = await supabase.rpc("get_patient_session", {
          p_session_token: data.session_token,
        });

        if (session?.success) {
          setPatientFirstName(session.patient_first_name);
          setHasPreviousVisits(session.has_previous_visits);
          setConsentGiven(session.consent_given);
          setVisitId(session.visit_id);
          if (session.queue_number != null) setQueueNumber(session.queue_number);
          if (onVisitCreated && session.visit_id) onVisitCreated(session.visit_id);
          if (session.language) setPatientLanguage(session.language);

          switch (session.status) {
            case "pending_approval":
              setState("waiting");
              break;
            case "still_answering_ai":
              routeStillAnsweringAi(session, data.session_token);
              break;
            case "awaiting_arrival":
              setState("awaiting_arrival");
              break;
            case "waiting_doctor_claim":
              if (session.queue_position !== undefined) setQueuePosition(session.queue_position);
              if (session.estimated_wait_minutes !== undefined) setEstimatedWait(session.estimated_wait_minutes);
              setState(session.timeout_flagged ? "timeout" : "queued");
              break;
            case "claimed_by_doctor":
              setStaffRoom(session.staff_room ?? null);
              setState("claimed");
              break;
            case "completed":
              setState("visit_completed");
              break;
            case "left":
              setState("patient_left");
              break;
            default:
              setState("chatting");
          }
        }
        setTokenValidating(false);
        return;
      }

      // Token unused: pre-fill form
      setPreCheckinToken(urlToken);
      if (data.name_match_mode !== "none" && data.first_name && data.last_name) {
        setPreCheckinName({ first: data.first_name, last: data.last_name });
      }
      setTokenValidating(false);
    })();
  }, [locationId, locationData.active, kiosk]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session recovery on mount — requires birthday verification on shared kiosks
  // Skipped entirely in kiosk mode (localStorage already cleared above)
  // Also skipped if URL has a ?token= param (token validation effect handles it)
  useEffect(() => {
    if (kiosk) return;
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("token")) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !locationData.active) return;

    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_patient_session", {
        p_session_token: saved,
      });

      // Transient RPC error — keep token for next reload attempt
      if (error || !data) return;

      // Definitive session failure (not found, expired) — clear token
      if (!data.success) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PHONE_STORAGE_KEY);
        return;
      }

      // If we have a birthday on file, require verification before restoring
      // (skip in demo mode — random birthdays, no need to verify)
      if (data.patient_birthday && !demoMode) {
        setPendingSession({
          token: saved,
          birthday: data.patient_birthday,
          sessionData: data,
        });
        setState("verify_birthday");
        return;
      }

      // No birthday on file — restore directly (legacy patients)
      setSessionToken(saved);
      setPatientFirstName(data.patient_first_name);
      setHasPreviousVisits(data.has_previous_visits);
      setConsentGiven(data.consent_given);
      setVisitId(data.visit_id);
      if (data.queue_number != null) setQueueNumber(data.queue_number);
      if (onVisitCreated && data.visit_id) onVisitCreated(data.visit_id);
      if (data.language) setPatientLanguage(data.language);

      // Recover stored phone
      const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
      if (savedPhone) setPatientPhone(savedPhone);

      // Resume at correct state based on visit status
      switch (data.status) {
        case "pending_approval":
          if (data.phone_verification_pending) {
            if (data.pending_phone) {
              setPatientPhone(data.pending_phone as string);
            } else {
              const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
              if (savedPhone) setPatientPhone(savedPhone);
            }
            setState("phone_verification");
          } else {
            setState("waiting");
          }
          break;
        case "still_answering_ai":
          routeStillAnsweringAi(data, saved);
          break;
        case "awaiting_arrival":
          setState("awaiting_arrival");
          break;
        case "waiting_doctor_claim":
          if (data.queue_position !== undefined) setQueuePosition(data.queue_position);
          if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes);
          setState(data.timeout_flagged ? "timeout" : "queued");
          break;
        case "claimed_by_doctor":
          setStaffRoom(data.staff_room ?? null);
          setState("claimed");
          break;
        case "left":
          setState(data.patient_denied ? "denied" : "patient_left");
          break;
        case "completed":
          setState("visit_completed");
          break;
        default:
          setState("form");
      }
    })();
  }, [locationData.active, kiosk]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback(
    (event: RealtimePayload) => {
      if (event.type === "queue_update") {
        setQueuePosition(event.payload.position);
        setEstimatedWait(event.payload.estimated_wait_minutes);
        return;
      }

      if (event.type === "summary_ready") {
        const payload = event.payload;
        setSummaryData({
          summary: payload.summary,
          structured_card: payload.structured_card,
        });
        fetchMedicalInfo();
        setState("summary_review");
        return;
      }

      // status_change — only status_change events reach here
      if (event.type !== "status_change") return;
      const { status, visit_id, timeout_flagged } = event.payload;

      if (visit_id) setVisitId(visit_id);

      if (status === "denied" || event.payload.denied) {
        setState("denied");
        return;
      }

      if (status === "left") {
        if (stateRef.current !== "denied") {
          setState("patient_left");
        }
        return;
      }

      if (status === "still_answering_ai") {
        const current = stateRef.current;
        // Do not yank the patient off an active screen. prescreening +
        // advance_error added so a forms-only patient mid-form (or retrying the
        // advance) is not interrupted by a duplicate still_answering_ai echo.
        if (
          current === "chatting" ||
          current === "generating_summary" ||
          current === "summary_review" ||
          current === "prescreening" ||
          current === "advance_error"
        ) {
          return;
        }
        (async () => {
          const supabase = createClient();
          const { data: sess } = await supabase.rpc("get_patient_session", { p_session_token: sessionToken });
          if (sess?.success) {
            routeStillAnsweringAi(sess, sessionToken ?? undefined);
          } else if (!consentGivenRef.current) {
            // No session yet but pre-consent we can still show the right intro.
            setState(aiSkippedRef.current ? "language" : "first_timer");
          }
        })();
        return;
      }

      if (status === "awaiting_arrival") {
        const current = stateRef.current;
        if (current === "summary_review" || current === "generating_summary") {
          return;
        }
        setState("awaiting_arrival");
        return;
      }

      if (status === "pending_approval") {
        // Mode-2 arrival: patient tapped "I have arrived" on a remote visit and
        // is now back in the approval queue. Transition from the arrival screen
        // to the waiting-for-approval screen. Also safe as a no-op if we are
        // already in "waiting" (e.g. mode-1 kiosk flow).
        const current = stateRef.current;
        if (current === "phone_verification") return;
        setState("waiting");
        return;
      }

      if (status === "waiting_doctor_claim") {
        // Skip if summary_review, generating_summary, or phone_verification —
        // those flows handle their own transitions
        const current = stateRef.current;
        if (
          current === "summary_review" ||
          current === "generating_summary" ||
          current === "phone_verification"
        ) {
          return;
        }
        fetchQueuePosition();
        setState(timeout_flagged ? "timeout" : "queued");
        return;
      }

      if (status === "claimed_by_doctor") {
        const current = stateRef.current;
        if (current === "phone_verification") {
          return;
        }
        if (event.payload.staff_room !== undefined) {
          setStaffRoom(event.payload.staff_room ?? null);
        }
        if (event.payload.claimer_role !== undefined) {
          const role = event.payload.claimer_role;
          setClaimerRole(role === "nurse" || role === "doctor" ? role : null);
        }
        // Mid-shift room edits also arrive as status_change with status still
        // claimed_by_doctor; do not replay the claim alert in that case.
        if (current === "claimed") {
          return;
        }
        setState("claimed");
        // Sound + vibration — works even when tab is active
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          if (ctx.state === "suspended") ctx.resume();
          const now = ctx.currentTime;
          [523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.value = 0.2;
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + (i + 1) * 0.15);
          });
        } catch { /* audio not available */ }
        // Vibration
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        // Browser notification when tab is backgrounded.
        // Use the claimer's role so a nurse-claim does not say "doctor".
        if (
          typeof document !== "undefined" &&
          document.hidden &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const claimRole = event.payload.claimer_role;
          const title = claimRole === "nurse" ? "Your nurse is ready" : "Your doctor is ready";
          new Notification(title, {
            body: "Please proceed to the front desk.",
            tag: `claimed-${visitId}`,
          });
        }
        return;
      }

      if (status === "completed") {
        const current = stateRef.current;
        if (current === "phone_verification") {
          return;
        }
        setState("visit_completed");
      }
    },
    [visitId]
  );

  // Activate realtime during waiting, chatting, generating_summary, summary_review, awaiting_arrival, queued, timeout, phone states
  const realtimeActive =
    state === "waiting" ||
    state === "first_timer" ||
    state === "language" ||
    state === "prescreening" ||
    state === "chatting" ||
    state === "generating_summary" ||
    state === "summary_review" ||
    state === "awaiting_arrival" ||
    state === "queued" ||
    state === "claimed" ||
    state === "timeout" ||
    state === "phone_verification" ||
    state === "match_resolution" ||
    state === "patient_left" ||
    state === "visit_completed";

  usePatientRealtime(
    realtimeActive ? sessionToken : null,
    handleRealtimeEvent
  );

  async function handleCheckin(
    firstName: string,
    lastName: string,
    birthday: string,
    sex: string,
    phone: string | null = null
  ) {
    setState("submitting");
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Pre-checkin token flow: use checkin_with_token instead
    if (preCheckinToken) {
      const { data: tokenData, error: tokenError } = await supabase.rpc("checkin_with_token", {
        p_token: preCheckinToken,
        p_first_name: firstName,
        p_last_name: lastName,
        p_birthday: birthday,
        p_sex: sex || null,
        p_phone: phone || null,
      });

      setLoading(false);

      if (tokenError || !tokenData?.success) {
        const errMsg = tokenData?.error || tokenError?.message || "Check-in failed.";
        if (errMsg === "subscription_inactive") {
          setState("subscription_inactive");
          return;
        }
        setError(errMsg);
        setState("form");
        return;
      }

      setPatientFirstName(firstName);
      setPatientSex(sex || null);
      setPatientBirthday(birthday);
      setHasPreviousVisits(tokenData.has_previous_visits);
      if (tokenData.queue_number != null) setQueueNumber(tokenData.queue_number);

      if (tokenData.match_type === "active_session") {
        // Already has active visit — recover session
        setSessionToken(tokenData.session_token);
        localStorage.setItem(STORAGE_KEY, tokenData.session_token);
        const { data: session } = await supabase.rpc("get_patient_session", {
          p_session_token: tokenData.session_token,
        });
        if (session?.success) {
          setConsentGiven(session.consent_given);
          setVisitId(session.visit_id);
          if (session.queue_number != null) setQueueNumber(session.queue_number);
          if (onVisitCreated && session.visit_id) onVisitCreated(session.visit_id);
          switch (session.status) {
            case "pending_approval":
              setState("waiting");
              break;
            case "still_answering_ai":
              routeStillAnsweringAi(session, tokenData.session_token);
              break;
            case "awaiting_arrival":
              setState("awaiting_arrival");
              break;
            case "waiting_doctor_claim":
              setState(session.timeout_flagged ? "timeout" : "queued");
              break;
            case "claimed_by_doctor":
              setStaffRoom(session.staff_room ?? null);
              setState("claimed");
              break;
            case "left":
              setState(session.patient_denied ? "denied" : "patient_left");
              break;
            case "completed":
              setState("visit_completed");
              break;
            default:
              setState("chatting");
          }
        }
        return;
      }

      // Pre-approved: visit created, skip approval + phone + discovery
      setSessionToken(tokenData.session_token);
      setVisitId(tokenData.visit_id);
      localStorage.setItem(STORAGE_KEY, tokenData.session_token);
      if (onVisitCreated && tokenData.visit_id) onVisitCreated(tokenData.visit_id);

      // Branch on the server-resolved initial status so that check-in modes
      // behave correctly (approve_to_start -> waiting for receptionist,
      // approve_on_arrival/self_service with skip_ai -> straight to arrival gate,
      // otherwise -> enter chat flow).
      setAiSkipped(!!tokenData.ai_skipped);
      switch (tokenData.status) {
        case "pending_approval":
          setState("waiting");
          break;
        case "awaiting_arrival":
          setState("awaiting_arrival");
          break;
        case "waiting_doctor_claim":
          setState("queued");
          break;
        case "still_answering_ai":
        default:
          // Forms only skips the AI-framed consent screen; language is still
          // shown so the prescreening form is localized.
          setState(tokenData.ai_skipped ? "language" : "first_timer");
      }
      return;
    }

    // Normal flow: checkin_patient
    const { data, error: rpcError } = await supabase.rpc("checkin_patient", {
      p_location_id: locationId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_birthday: birthday,
      p_sex: sex,
      p_phone: phone,
      p_team_code: teamCode || null,
    });

    setLoading(false);

    if (rpcError || !data?.success) {
      setError(data?.error || rpcError?.message || "Check-in failed.");
      setState("form");
      return;
    }

    setPatientFirstName(firstName);
    setPatientSex(sex || null);
    setPatientBirthday(birthday);
    setHasPreviousVisits(data.has_previous_visits);

    if (data.queue_number != null) setQueueNumber(data.queue_number);

    switch (data.match_type) {
      case "new":
      case "returning": {
        setSessionToken(data.session_token);
        setVisitId(data.visit_id);
        localStorage.setItem(STORAGE_KEY, data.session_token);
        if (onVisitCreated && data.visit_id) onVisitCreated(data.visit_id);
        if (typeof data.ai_skipped === "boolean") setAiSkipped(data.ai_skipped);
        // If phone was provided but not yet verified, go to phone verification
        if (data.phone_verified === false && phone) {
          setPatientPhone(phone);
          localStorage.setItem(PHONE_STORAGE_KEY, phone);
          setState("phone_verification");
        } else if (locationData?.ask_referral_source || (data.match_type === "new" && locationData?.ask_discovery_source)) {
          setState("discovery_question");
        } else {
          setState("waiting");
        }
        break;
      }
      case "active_session": {
        setSessionToken(data.session_token);
        localStorage.setItem(STORAGE_KEY, data.session_token);
        // Recover session state
        const { data: session } = await supabase.rpc("get_patient_session", {
          p_session_token: data.session_token,
        });
        if (session?.success) {
          setConsentGiven(session.consent_given);
          setVisitId(session.visit_id);
          if (session.queue_number != null) setQueueNumber(session.queue_number);
          if (onVisitCreated && session.visit_id) onVisitCreated(session.visit_id);

          // Show cross-location notice
          if (data.active_at_other_location) {
            setError(`You have an active session at ${data.other_location_name || "another location"}. Resuming that session.`);
          }

          if (session.status === "pending_approval") {
            if (session.phone_verification_pending) {
              if (session.pending_phone) {
                setPatientPhone(session.pending_phone);
              } else {
                const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
                if (savedPhone) setPatientPhone(savedPhone);
              }
              setState("phone_verification");
            } else {
              setState("waiting");
            }
          } else if (session.status === "still_answering_ai") {
            routeStillAnsweringAi(session, data.session_token);
          } else if (session.status === "awaiting_arrival") {
            setState("awaiting_arrival");
          } else if (session.status === "waiting_doctor_claim") {
            if (session.queue_position !== undefined) setQueuePosition(session.queue_position);
            if (session.estimated_wait_minutes !== undefined) setEstimatedWait(session.estimated_wait_minutes);
            setState(session.timeout_flagged ? "timeout" : "queued");
          } else if (session.status === "claimed_by_doctor") {
            setStaffRoom(session.staff_room ?? null);
            setState("claimed");
          } else if (session.status === "left") {
            setState("patient_left");
          } else {
            setState("chatting");
          }
        } else {
          setState("waiting");
        }
        break;
      }
      case "potential_match":
      case "potential_match_no_phone":
      case "potential_match_add_phone":
        // Do NOT set sessionToken or visitId — no visit created yet
        // Save form data for the resolve step
        setFormDataForResolve({ locationId, firstName, lastName, birthday, sex, phone });
        setMatchType(data.match_type);
        setState("match_resolution");
        break;
      default:
        setState("waiting");
    }
  }

  function handleRetry() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHONE_STORAGE_KEY);
    setSessionToken(null);
    setVisitId(null);
    setError("");
    setPatientPhone(null);
    setVerificationId(null);
    setMatchType(null);
    setFormDataForResolve(null);
    setState("form");
  }

  // Cancel from the waiting-for-approval screen. Marks the visit as "left" on
  // the server so the receptionist queue card is removed, then resets local state.
  async function handleCancelWait() {
    if (visitId && sessionToken) {
      const supabase = createClient();
      try {
        await supabase.rpc("cancel_patient_checkin", {
          p_visit_id: visitId,
          p_session_token: sessionToken,
        });
      } catch (err) {
        console.error("cancel_patient_checkin failed:", err);
      }
    }
    handleRetry();
  }

  function handleKioskReset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHONE_STORAGE_KEY);
    setSessionToken(null);
    setVisitId(null);
    setError("");
    setLoading(false);
    setLanguageLoading(false);
    setPatientPhone(null);
    setVerificationId(null);
    setPhoneError("");
    setPhoneLoading(false);
    setMatchType(null);
    setFormDataForResolve(null);
    setPatientLanguage("en");
    setSummaryData(null);
    setQueuePosition(null);
    setEstimatedWait(null);
    setPendingSession(null);
    setBirthdayInput("");
    setPatientFirstName("");
    setHasPreviousVisits(false);
    setConsentGiven(false);
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
    if (rpcError || !data?.success) {
      setLanguageLoading(false);
      setError(data?.error || "Failed to save preferences.");
      return;
    }

    setConsentGiven(true);
    setPatientLanguage(language);
    if (shouldShowPrescreening()) {
      await fetchMedicalInfo();
      setLanguageLoading(false);
      setState("prescreening");
    } else if (aiSkippedRef.current) {
      // Forms only with no visible prescreening sections: nothing to fill,
      // go straight to the queue (no AI chat).
      setLanguageLoading(false);
      void advanceFormsOnly();
    } else {
      setLanguageLoading(false);
      setState("chatting");
    }
  }

  // Forms-only: after the prescreening form, advance the visit to the queue /
  // arrival gate with no AI chat or summary. Mirrors handleSummaryApprove for
  // the no-AI path. On failure surface a retry instead of faking a queued state.
  // tokenOverride is used by resume paths where sessionToken state is not yet
  // committed (just-set via setSessionToken in the same render).
  async function advanceFormsOnly(tokenOverride?: string) {
    const tok = tokenOverride ?? sessionToken;
    if (!tok) {
      setState("advance_error");
      return;
    }
    const supabase = createClient();
    try {
      const { data: adv, error: advErr } = await supabase.rpc("advance_after_prescreening", {
        p_session_token: tok,
      });
      if (advErr || !adv?.success) {
        setError(adv?.error || advErr?.message || "");
        setState("advance_error");
        return;
      }
    } catch {
      setState("advance_error");
      return;
    }

    const { data } = await supabase.rpc("get_patient_session", {
      p_session_token: tok,
    });
    if (!data?.success) {
      setState("advance_error");
      return;
    }
    if (data.queue_position !== undefined) setQueuePosition(data.queue_position);
    if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes);
    if (onPhoneComplete) onPhoneComplete();
    switch (data.status) {
      case "awaiting_arrival":
        setState("awaiting_arrival");
        break;
      case "waiting_doctor_claim":
        setState(data.timeout_flagged ? "timeout" : "queued");
        break;
      case "pending_approval":
        setState("waiting");
        break;
      case "claimed_by_doctor":
        setStaffRoom(data.staff_room ?? null);
        setState("claimed");
        break;
      case "completed":
        setState("visit_completed");
        break;
      case "left":
        setState(data.patient_denied ? "denied" : "patient_left");
        break;
      default:
        setState("queued");
    }
  }

  // Shared router for a visit in still_answering_ai. One place so the AI path
  // and the forms-only (ai_skipped) path stay consistent across every resume,
  // recovery and realtime entry point. Forms-only never enters chat: pre-consent
  // it goes to the language picker (not the AI-framed first_timer), and once the
  // form is done (or there are no fields) it advances straight to the queue.
  function routeStillAnsweringAi(
    s: {
      ai_summary?: string | null;
      ai_structured_card?: Record<string, unknown> | null;
      ai_completed_at?: string | null;
      consent_given?: boolean;
      prescreening_data?: unknown;
      ai_skipped?: boolean;
    },
    tokenOverride?: string
  ) {
    if (typeof s.ai_skipped === "boolean") setAiSkipped(s.ai_skipped);
    if (s.ai_summary) {
      setSummaryData({ summary: s.ai_summary, structured_card: s.ai_structured_card ?? null });
      setState("summary_review");
    } else if (s.ai_completed_at) {
      setState("generating_summary");
    } else if (!s.consent_given) {
      setState(s.ai_skipped ? "language" : "first_timer");
    } else if (!s.prescreening_data && !s.ai_summary && shouldShowPrescreening()) {
      fetchMedicalInfo();
      setState("prescreening");
    } else if (s.ai_skipped) {
      // Forms only: form saved (or no visible fields) but not yet advanced.
      // advance_after_prescreening is idempotent, so this is safe on resume.
      void advanceFormsOnly(tokenOverride);
    } else {
      setState("chatting");
    }
  }

  function handlePrescreeningComplete() {
    if (aiSkippedRef.current) {
      // Forms only: no chat — advance straight to the queue / arrival gate.
      void advanceFormsOnly();
      return;
    }
    setState("chatting");
  }

  async function fetchMedicalInfo() {
    if (!sessionToken) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("get_patient_session", {
      p_session_token: sessionToken,
    });
    if (data?.success) {
      setMedicalInfo({
        medications: (data.medications || []) as { name: string }[],
        allergies: (data.allergies || []) as { name: string }[],
        chronic_conditions: (data.chronic_conditions || []) as { name: string }[],
        pets: (data.pets || []) as { name: string }[],
        custom_fields: (data.custom_fields || {}) as Record<string, { label: string; values: string[] }>,
      });
      if (!patientSex && data.sex) setPatientSex(data.sex);
      if (!patientBirthday && data.patient_birthday) setPatientBirthday(data.patient_birthday);
    }
  }

  function handleConversationComplete() {
    fetchMedicalInfo();
    if (summaryDataRef.current) {
      setState("summary_review");
    } else {
      setState("generating_summary");
    }
  }

  function handleChatError(errType: string) {
    if (errType === "no_credits" || errType === "ai_cycle_limit" || errType === "trial_screening_limit") {
      setState("no_credits");
    } else if (errType === "subscription_inactive") {
      setState("subscription_inactive");
    } else if (errType === "ai_error") {
      // moveToQueueOnError already called — visit is now in queue
      // The realtime listener will pick up the status change to waiting_doctor_claim
      // with timeout_flagged=true and transition to the timeout/queued state
      setState("timeout");
    } else {
      // Unknown error (e.g. function crash, session invalid) — move to timeout/queue as fallback
      setState("timeout");
    }
  }

  async function fetchQueuePosition() {
    if (!sessionToken) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("get_patient_session", {
      p_session_token: sessionToken,
    });
    if (data?.success) {
      if (data.queue_position !== undefined) setQueuePosition(data.queue_position);
      if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes);
    }
  }

  async function handleSummaryApprove() {
    const supabase = createClient();
    let nextStatus: string | null = null;
    if (sessionToken) {
      const { data } = await supabase.rpc("get_patient_session", {
        p_session_token: sessionToken,
      });
      if (data?.success) {
        if (data.queue_position !== undefined) setQueuePosition(data.queue_position);
        if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes);
        nextStatus = (data.status as string) ?? null;
      }
    }
    if (onPhoneComplete) onPhoneComplete();
    // In approve_on_arrival / self_service_on_arrival modes, the server routes
    // the post-summary visit to awaiting_arrival, not the doctor queue.
    if (nextStatus === "awaiting_arrival") {
      setState("awaiting_arrival");
    } else {
      setState("queued");
    }
  }

  function handleSummaryReject() {
    setSummaryData(null);
    setState("chatting");
  }

  // Phone handlers
  async function handlePhoneSubmit(phone: string) {
    setPhoneLoading(true);
    setPhoneError("");
    setPhoneRetryAt(null);
    setPhoneRetryReady(false);
    setPatientPhone(phone);
    localStorage.setItem(PHONE_STORAGE_KEY, phone);

    // Send verification code
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: "send_code",
          phone,
          session_token: sessionToken,
          visit_id: visitId,
          location_id: locationId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPhoneError(data.error || "Failed to send verification code");
        setPhoneRetryAt(Date.now() + 60_000);
        setPhoneLoading(false);
        return;
      }

      setVerificationId(data.verification_id);
      setPhoneLoading(false);
      setState("phone_verification");
    } catch {
      setPhoneError("Failed to send verification code. Please try again.");
      setPhoneRetryAt(Date.now() + 60_000);
      setPhoneLoading(false);
    }
  }

  async function handlePhoneVerified() {
    // Check if visit was completed while patient was in phone flow
    const supabase = createClient();
    if (sessionToken) {
      const { data } = await supabase.rpc("get_patient_session", { p_session_token: sessionToken });
      if (data?.success && data.status === "completed") {
        setState("visit_completed");
        return;
      }
    }
    // Phone verified — go to waiting (realtime will handle subsequent transitions)
    if (onPhoneComplete) onPhoneComplete();
    if (locationData?.ask_referral_source || (locationData?.ask_discovery_source && !hasPreviousVisits)) {
      setState("discovery_question");
    } else {
      setState("waiting");
    }
  }

  async function handlePhoneResend() {
    if (!patientPhone) return;
    await handlePhoneSubmit(patientPhone);
  }

  // Add handleMatchResolved callback
  const handleMatchResolved = useCallback((result: { matchType: string; sessionToken: string; visitId: string; phoneVerified: boolean; hasPhoneToVerify: boolean; isDiscoveryEligible?: boolean; queueNumber?: number | null }) => {
    if (result.queueNumber != null) setQueueNumber(result.queueNumber);
    // Store session
    setSessionToken(result.sessionToken);
    setVisitId(result.visitId);
    localStorage.setItem(STORAGE_KEY, result.sessionToken);
    if (onVisitCreated) onVisitCreated(result.visitId);

    if (result.matchType === "returning") {
      setHasPreviousVisits(true);
    }

    // Capture sex/birthday from original form data for prescreening
    if (formDataForResolve) {
      if (formDataForResolve.sex) setPatientSex(formDataForResolve.sex as string);
      if (formDataForResolve.birthday) setPatientBirthday(formDataForResolve.birthday as string);
    }

    // If phone needs verification, go to phone_verification
    if (!result.phoneVerified && result.hasPhoneToVerify) {
      const phone = formDataForResolve?.phone as string;
      if (phone) {
        setPatientPhone(phone);
        localStorage.setItem(PHONE_STORAGE_KEY, phone);
      }
      setState("phone_verification");
      return;
    }

    // Otherwise, proceed based on result
    if (locationData.ask_referral_source || (result.isDiscoveryEligible && locationData.ask_discovery_source)) {
      setState("discovery_question");
    } else {
      setState("waiting");
    }
  }, [onVisitCreated, locationData, formDataForResolve]);

  // Render based on state
  const content = (() => {
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
          address={locationData.address || ""}
          logoUrl={locationData.logo_url || null}
          onSubmit={handleCheckin}
          loading={loading}
          error={error}
          demoDefaults={demoDefaultsRef.current}
          preFill={preCheckinName ? { firstName: preCheckinName.first, lastName: preCheckinName.last } : undefined}
        />
      );

    case "verify_birthday":
      return (
        <div className="w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-ink mb-2">
            {t("checkin.verifyBirthday", patientLanguage)}
          </h2>
          <p className="text-sm text-slate mb-4">
            {t("checkin.verifyBirthdayDesc", patientLanguage)}
          </p>
          <DateInput
            value={birthdayInput}
            onChange={(e) => { setBirthdayInput(e.target.value); setError(""); }}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-base text-ink mb-3"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Clear session and start fresh
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(PHONE_STORAGE_KEY);
                setPendingSession(null);
                setBirthdayInput("");
                setState("form");
              }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-slate"
            >
              {t("checkin.startOver", patientLanguage)}
            </button>
            <button
              onClick={() => {
                if (!pendingSession) return;
                if (birthdayInput === pendingSession.birthday) {
                  // Birthday matches — restore session
                  const data = pendingSession.sessionData;
                  setSessionToken(pendingSession.token);
                  setPatientFirstName(data.patient_first_name as string);
                  setHasPreviousVisits(data.has_previous_visits as boolean);
                  setConsentGiven(data.consent_given as boolean);
                  setVisitId(data.visit_id as string);
                  if (data.queue_number != null) setQueueNumber(data.queue_number as number);
                  if (data.language) setPatientLanguage(data.language as string);
                  const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
                  if (savedPhone) setPatientPhone(savedPhone);
                  // Resume at correct state
                  const status = data.status as string;
                  if (status === "pending_approval") {
                    if (data.phone_verification_pending) {
                      if (data.pending_phone) {
                        setPatientPhone(data.pending_phone as string);
                      } else {
                        const sp = localStorage.getItem(PHONE_STORAGE_KEY);
                        if (sp) setPatientPhone(sp);
                      }
                      setState("phone_verification");
                    } else {
                      setState("waiting");
                    }
                  } else if (status === "still_answering_ai") {
                    routeStillAnsweringAi(
                      data as Parameters<typeof routeStillAnsweringAi>[0],
                      pendingSession?.token
                    );
                  } else if (status === "awaiting_arrival") {
                    setState("awaiting_arrival");
                  } else if (status === "waiting_doctor_claim") {
                    if (data.queue_position !== undefined) setQueuePosition(data.queue_position as number);
                    if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes as number | null);
                    setState((data.timeout_flagged as boolean) ? "timeout" : "queued");
                  } else if (status === "claimed_by_doctor") {
                    setStaffRoom((data.staff_room as string | null | undefined) ?? null);
                    setState("claimed");
                  } else if (status === "left") {
                    setState((data.patient_denied as boolean) ? "denied" : "patient_left");
                  } else if (status === "completed") {
                    setState("visit_completed");
                  } else {
                    localStorage.removeItem(STORAGE_KEY);
                    setState("form");
                  }
                  setPendingSession(null);
                  setBirthdayInput("");
                } else {
                  setError(t("checkin.birthdayMismatch", patientLanguage));
                }
              }}
              className="flex-1 rounded-lg bg-hilt-blue px-4 py-3 text-sm font-medium text-white"
            >
              {t("checkin.confirm", patientLanguage)}
            </button>
          </div>
        </div>
      );

    case "waiting":
      return (
        <WaitingApproval
          patientFirstName={patientFirstName}
          locationName={locationData.location_name || "the clinic"}
          onCancel={handleCancelWait}
          queueDisplay={locationData.queue_display_enabled ? formatQueueNumber(queueNumber, locationData.queue_type || "fifo") || null : null}
        />
      );

    case "denied":
      return kiosk ? (
        <KioskAutoReset onReset={handleKioskReset}>
          <DenialScreen onRetry={handleKioskReset} />
        </KioskAutoReset>
      ) : (
        <DenialScreen onRetry={handleRetry} />
      );

    case "first_timer":
      return <FirstTimerExplainer onContinue={handleConsentContinue} />;

    case "language":
      return (
        <LanguagePicker
          onSelect={handleLanguageSelect}
          loading={languageLoading}
        />
      );

    case "prescreening": {
      const config = locationData.prescreening_config ?? {
        medications_enabled: true,
        allergies_enabled: true,
        pets_enabled: true,
        pregnancy_enabled: true,
        custom_fields: [],
      };
      // Wait for medical info to load for returning patients (fetchMedicalInfo is async)
      if (hasPreviousVisits && !medicalInfo) {
        return (
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-hilt-blue" />
            </div>
          </div>
        );
      }
      return (
        <PreScreeningForm
          sessionToken={sessionToken!}
          config={config}
          patientSex={patientSex}
          patientBirthday={patientBirthday}
          hasPreviousVisits={hasPreviousVisits}
          existingMedications={medicalInfo?.medications || []}
          existingAllergies={medicalInfo?.allergies || []}
          existingPets={medicalInfo?.pets || []}
          existingCustomFields={medicalInfo?.custom_fields || {}}
          onComplete={handlePrescreeningComplete}
          demoMode={demoMode}
        />
      );
    }

    case "chatting":
      return visitId && sessionToken ? (
        <ChatInterface
          visitId={visitId}
          sessionToken={sessionToken}
          patientName={patientFirstName}
          locationName={locationData.location_name || "Clinic"}
          logoUrl={locationData.logo_url || null}
          onConversationComplete={handleConversationComplete}
          onError={handleChatError}
          onLanguageChange={(lang) => setPatientLanguage(lang)}
          heightClass={demoMode ? "flex-1 min-h-0" : undefined}
        />
      ) : null;

    case "generating_summary":
      return (
        <div className="w-full max-w-md text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">
            {t("generating.title", patientLanguage)}
          </h2>
          <p className="text-sm text-slate">
            {summaryWarning
              ? t("generating.slow", patientLanguage)
              : t("generating.subtitle", patientLanguage)}
          </p>
        </div>
      );

    case "summary_review":
      return visitId && sessionToken && summaryData ? (
        <div className="flex flex-col items-center w-full">
          {demoMode && (
            <div className="w-full max-w-md text-center mb-4">
              <p className="text-sm font-medium text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                Allergies, pets, and medications are collected in a pre-screening form. Returning patients see their previous answers pre-filled for confirmation.
              </p>
            </div>
          )}
          <SummaryReview
            visitId={visitId}
            sessionToken={sessionToken}
            summary={summaryData.summary}
            structuredCard={summaryData.structured_card}
            medicalInfo={medicalInfo}
            onApprove={handleSummaryApprove}
            onReject={handleSummaryReject}
          />
        </div>
      ) : null;

    case "awaiting_arrival":
      return visitId && sessionToken ? (
        <ArrivalConfirmScreen
          visitId={visitId}
          sessionToken={sessionToken}
          locationName={locationData.location_name || "the clinic"}
          onArrived={(nextStatus) => {
            if (nextStatus === "pending_approval") {
              setState("waiting");
            } else if (nextStatus === "waiting_doctor_claim") {
              fetchQueuePosition();
              setState("queued");
            }
          }}
        />
      ) : null;

    case "queued":
      return visitId && sessionToken ? (
        <PatientQueueView
          queuePosition={demoMode ? 1 : queuePosition}
          estimatedWait={demoMode ? 1 : estimatedWait}
          visitId={visitId}
          sessionToken={sessionToken}
          queueDisplay={locationData.queue_display_enabled ? formatQueueNumber(queueNumber, locationData.queue_type || "fifo") || null : null}
          showTvPreview={demoMode && !!locationData.queue_display_enabled}
        />
      ) : null;

    case "claimed":
      return <DoctorClaimedNotice staffRoom={staffRoom} claimerRole={claimerRole} />;

    case "advance_error":
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">One more step</h2>
          <p className="text-sm text-slate mb-4">
            We saved your information but could not add you to the queue. Please try again.
          </p>
          <button
            onClick={() => { void advanceFormsOnly(); }}
            className="rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
          >
            Try again
          </button>
        </div>
      );

    case "timeout": {
      const timeoutContent = (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">
            {t("timeout.title", patientLanguage)}
          </h2>
          <p className="text-sm text-slate">
            {t("timeout.subtitle", patientLanguage)}
          </p>
        </div>
      );
      return kiosk ? (
        <KioskAutoReset onReset={handleKioskReset}>{timeoutContent}</KioskAutoReset>
      ) : timeoutContent;
    }

    case "no_credits":
      return kiosk ? (
        <KioskAutoReset onReset={handleKioskReset}><CreditWarning /></KioskAutoReset>
      ) : <CreditWarning />;

    case "match_resolution":
      return matchType && formDataForResolve ? (
        <MatchResolution
          matchType={matchType as "potential_match" | "potential_match_no_phone" | "potential_match_add_phone"}
          formData={{
            locationId,
            firstName: formDataForResolve.firstName as string,
            lastName: formDataForResolve.lastName as string,
            birthday: formDataForResolve.birthday as string,
            sex: formDataForResolve.sex as string,
            phone: formDataForResolve.phone as string | null,
          }}
          onResolved={handleMatchResolved}
          onError={(err) => { setError(err); setState("form"); }}
          isDemo={demoMode}
        />
      ) : null;

    case "phone_verification":
      if (!patientPhone || !visitId || !sessionToken) return null;
      if (!verificationId) {
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            {phoneError ? (
              <>
                <p className="text-sm text-red-600">{phoneError}</p>
                {phoneRetryReady && (
                  <button
                    onClick={() => handlePhoneSubmit(patientPhone)}
                    className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90"
                  >
                    Retry
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                <p className="text-sm text-slate">Sending verification code...</p>
              </>
            )}
          </div>
        );
      }
      return (
        <PhoneVerification
          phone={patientPhone}
          visitId={visitId}
          sessionToken={sessionToken}
          locationId={locationId}
          verificationId={verificationId}
          onVerified={handlePhoneVerified}
          onResend={handlePhoneResend}
          onError={(msg) => setPhoneError(msg)}
        />
      );

    case "patient_left":
      return kiosk ? (
        <KioskAutoReset onReset={handleKioskReset}>
          <PatientLeftScreen onRetry={handleKioskReset} />
        </KioskAutoReset>
      ) : (
        <PatientLeftScreen onRetry={handleRetry} />
      );

    case "visit_completed":
      return (
        <VisitCompletedScreen
          onAutoReset={kiosk ? handleKioskReset : () => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PHONE_STORAGE_KEY);
            handleRetry();
          }}
        />
      );

    case "subscription_inactive":
      return kiosk ? (
        <KioskAutoReset onReset={handleKioskReset}><SubscriptionExpiredScreen /></KioskAutoReset>
      ) : <SubscriptionExpiredScreen />;

    case "discovery_question":
      return (
        <DiscoveryQuestionScreen
          showReferral={!!locationData.ask_referral_source}
          showDiscovery={!!locationData.ask_discovery_source && !hasPreviousVisits}
          onComplete={async (wasReferred, referredBy, discoverySource) => {
            const supabase = createClient();
            if (wasReferred && visitId) {
              void supabase.rpc("create_self_reported_referral", {
                p_visit_id: visitId,
                p_referred_by: referredBy || null,
              });
            }
            if (discoverySource && visitId) {
              void supabase.rpc("set_discovery_source", {
                p_visit_id: visitId,
                p_source: discoverySource,
              });
            }
            // Realtime is inactive on this screen; the front desk may have
            // approved/denied while the patient was answering. Resync status
            // before transitioning so we never land on a stale waiting screen.
            if (!sessionToken) {
              setState("waiting");
              return;
            }
            const { data } = await supabase.rpc("get_patient_session", { p_session_token: sessionToken });
            if (!data?.success) {
              setState("waiting");
              return;
            }
            switch (data.status) {
              case "pending_approval":
                setState("waiting");
                break;
              case "still_answering_ai":
                routeStillAnsweringAi(data, sessionToken ?? undefined);
                break;
              case "awaiting_arrival":
                setState("awaiting_arrival");
                break;
              case "waiting_doctor_claim":
                if (data.queue_position !== undefined) setQueuePosition(data.queue_position);
                if (data.estimated_wait_minutes !== undefined) setEstimatedWait(data.estimated_wait_minutes);
                setState(data.timeout_flagged ? "timeout" : "queued");
                break;
              case "claimed_by_doctor":
                setStaffRoom(data.staff_room ?? null);
                setState("claimed");
                break;
              case "completed":
                setState("visit_completed");
                break;
              case "left":
                setState(data.patient_denied ? "denied" : "patient_left");
                break;
              default:
                setState("waiting");
            }
          }}
          language={patientLanguage}
        />
      );

    default:
      return null;
  }
  })();

  const needsFullHeight = demoMode && (state === "chatting" || state === "generating_summary");

  return (
    <LanguageProvider language={patientLanguage}>
      <div dir={patientLanguage === "ar" ? "rtl" : "ltr"} className={needsFullHeight ? "flex-1 w-full min-h-0 flex flex-col" : demoMode ? "flex-1 w-full min-h-0 overflow-y-auto" : "flex items-start justify-center flex-1"}>
        <div key={state} className={needsFullHeight ? "flex-1 min-h-0 w-full flex flex-col items-center animate-fade-in" : demoMode ? "min-h-full flex items-start justify-center animate-fade-in py-4" : "animate-fade-in"}>
          {content}
        </div>
        {kiosk && (
          <KioskIdleTimeout
            onReset={handleKioskReset}
            active={state !== "form" && state !== "inactive" && state !== "subscription_inactive"}
          />
        )}
        {embed && !kiosk && (
          <div className="fixed bottom-2 right-2 z-50">
            <a
              href="https://hilthealth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ash hover:text-slate transition-colors"
            >
              Powered by HiltHealth.com
            </a>
          </div>
        )}
        {kiosk && (
          <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
            {state !== "form" && state !== "inactive" && (
              <button
                onClick={handleKioskReset}
                className="rounded-full bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                End Session
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium text-white">Kiosk Mode</span>
            </div>
          </div>
        )}
      </div>
    </LanguageProvider>
  );
}
