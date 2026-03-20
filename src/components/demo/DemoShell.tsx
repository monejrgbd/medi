"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import DemoTabBar, { type Tab } from "@/components/demo/DemoTabBar";
import DemoTimeline from "@/components/demo/DemoTimeline";
import DemoComplete from "@/components/demo/DemoComplete";
import DemoFAQ from "@/components/demo/DemoFAQ";
import CheckinFlow from "@/app/checkin/[locationId]/CheckinFlow";
import ReceptionistDashboard from "@/app/(dashboard)/d/receptionist/ReceptionistDashboard";
import DoctorDashboard from "@/app/(dashboard)/d/doctor/DoctorDashboard";
import ReviewHub from "@/components/reviews/ReviewHub";

interface DemoShellProps {
  locationId: string;
  locationData: {
    active: boolean;
    location_name?: string;
    address?: string;
    specialty?: string;
    operating_hours?: Record<string, string> | null;
    org_name?: string;
    logo_url?: string | null;
  };
  orgId: string;
  staffUserId: string;
  locationName: string;
  receptionistInitial: {
    pending: any[];
    active: any[];
    completed: any[];
    counts: any;
  };
  doctorInitial: {
    queue: any[];
    claimed: any[];
    completed: any[];
    left: any[];
    doctors: any[];
    hasMoreCompleted: boolean;
    hasMoreLeft: boolean;
  };
  reviewsInitial: {
    reviews: any[];
    stats: any;
  };
}

// Tab type imported from DemoTabBar

export default function DemoShell({
  locationId,
  locationData,
  orgId,
  staffUserId,
  locationName,
  receptionistInitial,
  doctorInitial,
  reviewsInitial,
}: DemoShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("patient");
  const [pulsingTab, setPulsingTab] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoVisitId, setDemoVisitId] = useState<string | null>(null);
  const [demoKey, setDemoKey] = useState(0);
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);
  const [phoneStepDone, setPhoneStepDone] = useState(false);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [visitClaimed, setVisitClaimed] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const router = useRouter();

  const demoVisitIdRef = useRef(demoVisitId);
  useEffect(() => { demoVisitIdRef.current = demoVisitId; }, [demoVisitId]);

  const demoStepRef = useRef(demoStep);
  useEffect(() => { demoStepRef.current = demoStep; }, [demoStep]);

  // Persist visit ID to sessionStorage
  useEffect(() => {
    if (demoVisitId) {
      sessionStorage.setItem("demo_visit_id", demoVisitId);
    }
  }, [demoVisitId]);

  // On mount: restore visit ID from sessionStorage, then check status in DB
  useEffect(() => {
    const stored = sessionStorage.getItem("demo_visit_id");
    if (!stored) return;
    demoStepRef.current = 99; // Block handleVisitCreated from overriding during restore
    const supabase = createClient();
    supabase.rpc("get_visit_status", { p_visit_id: stored }).then(({ data, error }) => {
      if (error || !data?.success) {
        console.warn("[Demo] get_visit_status failed:", error?.message || data?.error);
        sessionStorage.removeItem("demo_visit_id");
        demoStepRef.current = 1;
        return;
      }
      // Set visit ID only after we know the status — prevents FocusMode from auto-claiming during restore
      setDemoVisitId(stored);
      const statusToStep: Record<string, number> = {
        pending_approval: 2,
        still_answering_ai: 3,
        waiting_doctor_claim: 3,
        claimed_by_doctor: 4,
        completed: 5,
      };
      const step = statusToStep[data.status];
      if (step) {
        setDemoStep(step);
        if (step === 5) { setVisitCompleted(true); setActiveTab("reviews"); }
        if (step === 4) { setVisitClaimed(true); setActiveTab("doctor"); }
        if (step === 3) setActiveTab("patient");
        if (step === 2) setActiveTab("receptionist");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Auto-switch to doctor tab once phone step is complete
  useEffect(() => {
    if (waitingForDoctor && phoneStepDone) {
      setPulsingTab("doctor");
      setTimeout(() => {
        setActiveTab("doctor");
        setPulsingTab(null);
        setDemoStep(4);
      }, 3000);
      setWaitingForDoctor(false);
    }
  }, [waitingForDoctor, phoneStepDone]);

  // Auto-switch back to doctor tab if user leaves while visit is claimed
  useEffect(() => {
    if (!visitClaimed || activeTab === "doctor") return;
    const timer = setTimeout(() => {
      setActiveTab("doctor");
    }, 50_000);
    return () => clearTimeout(timer);
  }, [visitClaimed, activeTab]);

  // Realtime auto-switching
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`demo:${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          if (payload.new.status === "pending_approval") {
            // Capture visit ID as backup (onVisitCreated is primary)
            const visitId = (payload.new as { id?: string }).id;
            // Ignore if this is a different session's visit
            if (demoVisitIdRef.current && visitId !== demoVisitIdRef.current) return;
            if (visitId) setDemoVisitId((prev) => prev ?? visitId);

            setDemoStep(2);
            setPulsingTab("receptionist");
            setTimeout(() => {
              setActiveTab("receptionist");
              setPulsingTab(null);
            }, 3000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          const visitId = (payload.new as { id?: string }).id;
          // Only process events for the current demo visit
          if (demoVisitIdRef.current && visitId !== demoVisitIdRef.current) return;

          const status = payload.new?.status;

          if (status === "still_answering_ai" && demoStepRef.current < 3) {
            setDemoStep(3);
            setPulsingTab("patient");
            setTimeout(() => {
              setActiveTab("patient");
              setPulsingTab(null);
            }, 3000);
          }

          if (status === "waiting_doctor_claim") {
            setWaitingForDoctor(true);
          }

          if (status === "claimed_by_doctor") {
            setVisitClaimed(true);
          }

          if (status === "completed" && demoStepRef.current < 5) {
            setVisitClaimed(false);
            setVisitCompleted(true);
            setDemoStep(5);
            setPulsingTab("reviews");
            setTimeout(() => {
              setActiveTab("reviews");
              setPulsingTab(null);
            }, 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  // After visit completes: fetch review token + poll for review submission
  useEffect(() => {
    if (!visitCompleted || !demoVisitId || reviewSubmitted) return;
    const supabase = createClient();

    // Fetch review token from the visit
    supabase
      .from("visits")
      .select("review_token")
      .eq("id", demoVisitId)
      .single()
      .then(({ data }) => {
        if (data?.review_token) setReviewToken(data.review_token);
      });

    // Poll for review submission every 5s
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("reviews")
        .select("submitted_at")
        .eq("visit_id", demoVisitId)
        .not("submitted_at", "is", null)
        .maybeSingle();

      if (data) {
        setReviewSubmitted(true);
        clearInterval(interval);
        router.refresh(); // Refresh ReviewHub data
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [visitCompleted, demoVisitId, reviewSubmitted, router]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setPulsingTab(null);
  }

  const handleVisitCreated = useCallback((visitId: string) => {
    setDemoVisitId(visitId);
    if (demoStepRef.current > 1) return;
    setDemoStep(2);
    setPulsingTab("receptionist");
    setTimeout(() => {
      setActiveTab("receptionist");
      setPulsingTab(null);
    }, 3000);
  }, []);

  const handlePhoneComplete = useCallback(() => {
    setPhoneStepDone(true);
  }, []);

  function handleRestart() {
    // Clear patient session from localStorage so CheckinFlow starts fresh
    if (typeof window !== "undefined") {
      localStorage.removeItem("hilt_session_token");
      localStorage.removeItem("hilt_session_phone");
      sessionStorage.removeItem("demo_visit_id");
    }
    setDemoVisitId(null);
    setWaitingForDoctor(false);
    setPhoneStepDone(false);
    setVisitCompleted(false);
    setVisitClaimed(false);
    setDemoStep(1);
    setReviewToken(null);
    setReviewSubmitted(false);
    setDemoComplete(false);
    setActiveTab("patient");
    // Force CheckinFlow remount with fresh state
    setDemoKey((prev) => prev + 1);
  }

  if (demoComplete) {
    return <DemoComplete onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen bg-snow flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Homepage</span>
        </Link>
        <span className="font-semibold text-hilt-blue text-sm">
          Hilt Health Demo
        </span>
        <div className="w-[130px] flex justify-end">
          {visitCompleted && (
            <button
              onClick={() => setDemoComplete(true)}
              className="rounded-lg bg-hilt-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-hilt-blue/90 transition-colors"
            >
              Finish Demo
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <DemoTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pulsingTab={pulsingTab}
      />

      {/* Timeline */}
      <DemoTimeline currentStep={demoStep} />



      {/* Content area — all 3 mounted, toggled via display */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-snow" style={{ display: activeTab === "patient" ? "flex" : "none" }}>
          <div className="h-full w-full flex flex-col items-center px-4 pt-6">
            <div className="flex-1 w-full max-w-[40rem] min-h-0 flex flex-col items-center mx-auto">
              <CheckinFlow
                key={demoKey}
                locationId={locationId}
                locationData={locationData}
                demoMode={true}
                onVisitCreated={handleVisitCreated}
                onPhoneComplete={handlePhoneComplete}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: activeTab === "receptionist" ? "block" : "none",
          }}
        >
          <ReceptionistDashboard
            key={demoKey}
            mode="dashboard"
            locations={[]}
            staffUserId={staffUserId}
            isOwner={false}
            orgId={orgId}
            locationId={locationId}
            locationName={locationName}
            initialPending={receptionistInitial.pending}
            initialActive={receptionistInitial.active}
            initialCompleted={receptionistInitial.completed}
            initialCounts={receptionistInitial.counts}
            demoMode={true}
            demoVisitId={demoVisitId}
          />
        </div>

        <div
          style={{ display: activeTab === "doctor" ? "block" : "none" }}
        >
          <DoctorDashboard
            key={demoKey}
            mode="dashboard"
            locations={[]}
            staffUserId={staffUserId}
            isOwner={false}
            orgId={orgId}
            locationId={locationId}
            locationName={locationName}
            initialQueue={doctorInitial.queue}
            initialClaimed={doctorInitial.claimed}
            initialCompleted={doctorInitial.completed}
            initialLeft={doctorInitial.left}
            initialDoctors={doctorInitial.doctors}
            initialHasMoreCompleted={doctorInitial.hasMoreCompleted}
            initialHasMoreLeft={doctorInitial.hasMoreLeft}
            demoMode={true}
            demoVisitId={demoVisitId}
          />
        </div>

        <div style={{ display: activeTab === "reviews" ? "block" : "none" }}>
          <div className="mx-auto max-w-6xl">
            {/* Review submission guidance */}
            {visitCompleted && !reviewSubmitted && reviewToken && (
              <div className="mx-4 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Your patient just received an SMS with a review link
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  Try it yourself. This is exactly what your patients see after every visit. Open the link below or check the SMS on your phone.
                </p>
                <a
                  href={`/review/${reviewToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-hilt-blue px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Open Review Page
                </a>
              </div>
            )}

            {/* Success banner after review submitted */}
            {reviewSubmitted && (
              <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-sm font-medium text-green-800 mb-1">
                  Your review is in! See it below in the dashboard.
                </p>
                <p className="text-xs text-green-600 mb-3">
                  This is what clinic owners and managers see when patients leave feedback.
                </p>
                <button
                  onClick={() => setDemoComplete(true)}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Finish Demo
                </button>
              </div>
            )}

            <ReviewHub
              locations={[{ id: locationId, name: locationName }]}
              isOwnerOrManager={true}
              demoMode={true}
              initialReviews={reviewsInitial.reviews}
              initialStats={reviewsInitial.stats}
            />
          </div>
        </div>

        <div style={{ display: activeTab === "faq" ? "block" : "none" }}>
          <DemoFAQ />
        </div>
      </div>
    </div>
  );
}
