"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, ClipboardList, HeartPulse, Stethoscope, Star, Megaphone, HelpCircle } from "lucide-react";
import DemoTabBar, { type Tab, type TabDef } from "@/components/demo/DemoTabBar";
import DemoTimeline from "@/components/demo/DemoTimeline";
import DemoComplete from "@/components/demo/DemoComplete";
import DemoFAQ from "@/components/demo/DemoFAQ";
import { DemoIntroCard, DemoGearButton } from "@/components/demo/DemoCustomizePanel";
import { setVisitDemoFeatures } from "@/app/demo/_actions/demo-features";
import { skipAiToQueue } from "@/app/(dashboard)/d/_actions/receptionist";
import NurseDashboard from "@/app/(dashboard)/d/nurse/NurseDashboard";
import CheckinFlow from "@/app/checkin/[locationId]/CheckinFlow";
import ReceptionistDashboard from "@/app/(dashboard)/d/receptionist/ReceptionistDashboard";
import DoctorDashboard from "@/app/(dashboard)/d/doctor/DoctorDashboard";
import ReviewHub from "@/components/reviews/ReviewHub";
import MarketingDashboard from "@/components/dashboard/marketing/MarketingDashboard";
import CampaignDetail from "@/components/dashboard/marketing/CampaignDetail";
import { RoleProvider } from "@/contexts/RoleContext";
import { DemoFeatureProvider, useDemoFeatures } from "@/contexts/DemoFeatureContext";
import { getCampaignDetail } from "@/app/(dashboard)/d/_actions/marketing";

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
  nurseInitial: {
    queue: any[];
    claimed: any[];
    completed: any[];
    left: any[];
    hasMoreCompleted: boolean;
    hasMoreLeft: boolean;
  };
  reviewsInitial: {
    reviews: any[];
    stats: any;
  };
  marketingInitial: any;
}

// Tab type imported from DemoTabBar

export default function DemoShell(props: DemoShellProps) {
  return (
    <DemoFeatureProvider>
      <DemoShellInner {...props} />
    </DemoFeatureProvider>
  );
}

function DemoShellInner({
  locationId,
  locationData,
  orgId,
  staffUserId,
  locationName,
  receptionistInitial,
  doctorInitial,
  nurseInitial,
  reviewsInitial,
  marketingInitial,
}: DemoShellProps) {
  const { features, isCustomized } = useDemoFeatures();

  const receptionistRoleValue = useMemo(() => ({
    org: {
      id: orgId,
      name: locationData.org_name || "Smith Family Clinic",
      slug: "smith-family-clinic",
      owner_id: "",
      subscription_plan: "professional",
      credits_total: 10000,
      credits_used: 0,
      trial_end_date: "",
      onboarding_completed_at: null,
      cancel_at_period_end: null,
      created_at: "",
    } as any,
    roles: [{ role: "receptionist", location_id: locationId, location_name: locationName }],
    isOwner: false,
    currentStaffUser: { id: staffUserId, org_id: orgId, auth_uid: "", full_name: "Demo User", username: "demo" },
  }), [orgId, locationData.org_name, locationId, locationName, staffUserId]);

  const [activeTab, setActiveTab] = useState<Tab>("patient");
  const [pulsingTab, setPulsingTab] = useState<string | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoVisitId, setDemoVisitId] = useState<string | null>(null);
  const [demoKey, setDemoKey] = useState(0);
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);
  const [phoneStepDone, setPhoneStepDone] = useState(false);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [visitClaimed, setVisitClaimed] = useState(false);
  const [nurseStepDone, setNurseStepDone] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaignData, setSelectedCampaignData] = useState<any>(null);
  const [demoCampaignIds, setDemoCampaignIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("demo_campaign_ids") || "[]"); } catch { return []; }
    }
    return [];
  });
  const DEMO_SCAN_LIMIT = 3;

  // Build tabs array based on features
  const tabs: TabDef[] = useMemo(() => [
    {
      key: "patient" as Tab,
      label: "Patient",
      icon: User,
      accent: "border-blue-500 text-blue-600",
      bg: "bg-blue-50",
      dot: "bg-blue-500",
      enabled: true,
    },
    {
      key: "receptionist" as Tab,
      label: "Receptionist",
      icon: ClipboardList,
      accent: "border-green-500 text-green-600",
      bg: "bg-green-50",
      dot: "bg-green-500",
      enabled: true,
    },
    {
      key: "nurse" as Tab,
      label: "Nurse",
      icon: HeartPulse,
      accent: "border-teal-500 text-teal-600",
      bg: "bg-teal-50",
      dot: "bg-teal-500",
      enabled: features.nurseEnabled,
    },
    {
      key: "doctor" as Tab,
      label: "Doctor",
      icon: Stethoscope,
      accent: "border-purple-500 text-purple-600",
      bg: "bg-purple-50",
      dot: "bg-purple-500",
      enabled: true,
    },
    {
      key: "reviews" as Tab,
      label: "Reviews",
      icon: Star,
      accent: "border-orange-500 text-orange-600",
      bg: "bg-orange-50",
      dot: "bg-orange-500",
      enabled: features.reviewCollection,
    },
    {
      key: "marketing" as Tab,
      label: "Marketing",
      icon: Megaphone,
      accent: "border-blue-500 text-blue-600",
      bg: "bg-blue-50",
      dot: "bg-blue-500",
      enabled: true,
    },
    {
      key: "faq" as Tab,
      label: "Q&A",
      icon: HelpCircle,
      accent: "border-amber-500 text-amber-600",
      bg: "bg-amber-50",
      dot: "bg-amber-500",
      enabled: true,
    },
  ], [features.nurseEnabled, features.reviewCollection]);

  // Demo reviews: only show 6 curated + current visitor's review
  const DEMO_REVIEW_IDS = new Set([
    "dcd0a06c-800d-4a71-810a-826b1b66d970",
    "de99d4f9-b8f6-4a89-933e-fb5879c36f5f",
    "c1bdf33f-8711-40cd-afbd-716892c9ef30",
    "3959e210-e4f2-4a8b-b3e2-1ff5a5c5568b",
    "288d696d-76e7-4e67-b1a4-adddc6396a12",
    "1fbb3cf1-b443-4fd6-b172-012566090662",
  ]);
  const filteredInitialReviews = (reviewsInitial.reviews || []).filter(
    (r: any) => DEMO_REVIEW_IDS.has(r.id)
  );
  const [demoReviews, setDemoReviews] = useState<any[]>(filteredInitialReviews);

  // Compute stats from the curated list only
  const demoStats = {
    avg_rating: demoReviews.length > 0
      ? Math.round((demoReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / demoReviews.length) * 100) / 100
      : 0,
    total_count: demoReviews.length,
    per_doctor: Object.values(
      demoReviews.reduce((acc: Record<string, { doctor_name: string; total: number; count: number }>, r: any) => {
        const name = r.doctor_name || "Unknown";
        if (!acc[name]) acc[name] = { doctor_name: name, total: 0, count: 0 };
        acc[name].total += r.rating || 0;
        acc[name].count += 1;
        return acc;
      }, {})
    ).map((d: any) => ({ doctor_name: d.doctor_name, avg_rating: Math.round((d.total / d.count) * 100) / 100, count: d.count })),
  };
  const router = useRouter();

  const demoVisitIdRef = useRef(demoVisitId);
  useEffect(() => { demoVisitIdRef.current = demoVisitId; }, [demoVisitId]);

  const demoStepRef = useRef(demoStep);
  useEffect(() => { demoStepRef.current = demoStep; }, [demoStep]);

  const featuresRef = useRef(features);
  useEffect(() => { featuresRef.current = features; }, [features]);

  const nurseStepDoneRef = useRef(nurseStepDone);
  useEffect(() => { nurseStepDoneRef.current = nurseStepDone; }, [nurseStepDone]);

  // Persist visit ID to sessionStorage
  useEffect(() => {
    if (demoVisitId) {
      sessionStorage.setItem("demo_visit_id", demoVisitId);
    }
  }, [demoVisitId]);

  // Synchronous cleanup: if no active demo in sessionStorage, this is a fresh demo (new tab).
  // Clear stale CheckinFlow tokens BEFORE CheckinFlow mounts and tries to recover them.
  // Must be synchronous (not useEffect) because children's effects fire before parent's.
  const cleanupDoneRef = useRef(false);
  if (!cleanupDoneRef.current) {
    cleanupDoneRef.current = true;
    if (typeof window !== "undefined" && !sessionStorage.getItem("demo_visit_id")) {
      localStorage.removeItem("hilt_session_token");
      localStorage.removeItem("hilt_session_phone");
    }
  }

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
      // Re-write demo features on session recovery (ensures features are set even for visits created before fixes)
      setVisitDemoFeatures(stored, { ...featuresRef.current });
      // If visit is stuck in still_answering_ai and skipAi is on, advance it past AI
      if (data.status === "still_answering_ai" && featuresRef.current.skipAi) {
        skipAiToQueue(stored);
      }
      const statusToStep: Record<string, number> = {
        pending_approval: 2,
        still_answering_ai: 3,
        waiting_doctor_claim: 3,
        claimed_by_doctor: 4,
        completed: 5,
      };
      const step = statusToStep[data.status];
      if (step) {
        // If campaign was already done, show step 7 (all complete)
        const campaignDone = localStorage.getItem("demo_campaign_done") === "true";
        setDemoStep(campaignDone && step >= 5 ? 7 : step);
        if (step === 5) { setVisitCompleted(true); setActiveTab(featuresRef.current.reviewCollection ? "reviews" : "marketing"); }
        if (step === 4) {
          if (featuresRef.current.nurseEnabled && !data.nurse_reviewed) {
            setActiveTab("nurse");
          } else {
            if (featuresRef.current.nurseEnabled) {
              setNurseStepDone(true);
              nurseStepDoneRef.current = true;
            }
            setVisitClaimed(true);
            setActiveTab("doctor");
          }
        }
        if (step === 3) {
          if (data.status === "waiting_doctor_claim" && featuresRef.current.nurseEnabled && !data.nurse_reviewed) {
            setActiveTab("nurse");
          } else {
            setActiveTab("patient");
          }
        }
        if (step === 2) setActiveTab("receptionist");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Auto-switch to nurse or doctor tab once phone step is complete
  useEffect(() => {
    if (waitingForDoctor && phoneStepDone) {
      if (features.nurseEnabled && !nurseStepDone) {
        // Route to nurse first
        setPulsingTab("nurse");
        setTimeout(() => {
          setActiveTab("nurse");
          setPulsingTab(null);
        }, 3000);
      } else {
        // Route to doctor
        setPulsingTab("doctor");
        setTimeout(() => {
          setActiveTab("doctor");
          setPulsingTab(null);
          setDemoStep(4);
        }, 3000);
      }
      setWaitingForDoctor(false);
    }
  }, [waitingForDoctor, phoneStepDone, features.nurseEnabled, nurseStepDone]);

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
            if (visitId) {
              setDemoVisitId((prev) => prev ?? visitId);
              // Write demo features to visit (ensures features are set even if this fires before onVisitCreated)
              setVisitDemoFeatures(visitId, { ...featuresRef.current });
            }

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
            // If skipAi is on, advance past AI immediately
            if (featuresRef.current.skipAi && visitId) {
              skipAiToQueue(visitId);
              return;
            }
            setDemoStep(3);
            setPulsingTab("patient");
            setTimeout(() => {
              setActiveTab("patient");
              setPulsingTab(null);
            }, 3000);
          }

          if (status === "waiting_doctor_claim") {
            const nurseReviewed = payload.new.nurse_reviewed;
            if (featuresRef.current.nurseEnabled && nurseReviewed === true && !nurseStepDoneRef.current) {
              nurseStepDoneRef.current = true;
              setNurseStepDone(true);
            }
            setWaitingForDoctor(true);
          }

          if (status === "claimed_by_doctor") {
            // Suppress visitClaimed during nurse step to prevent 50s auto-return timer
            if (!(featuresRef.current.nurseEnabled && !nurseStepDoneRef.current)) {
              setVisitClaimed(true);
            }
          }

          if (status === "completed" && demoStepRef.current < 5) {
            setVisitClaimed(false);
            setVisitCompleted(true);
            setDemoStep(5);
            // Skip to marketing if reviews are disabled
            if (!features.reviewCollection) {
              setPulsingTab("marketing");
              setTimeout(() => {
                setActiveTab("marketing");
                setPulsingTab(null);
              }, 4000);
            } else {
              setPulsingTab("reviews");
              setTimeout(() => {
                setActiveTab("reviews");
                setPulsingTab(null);
              }, 4000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, features.reviewCollection]);

  // After visit completes: fetch review token + poll for review submission
  useEffect(() => {
    if (!visitCompleted || !demoVisitId || reviewSubmitted) return;
    // If reviews disabled, skip directly to step 6
    if (!features.reviewCollection) {
      setDemoStep(6);
      setPulsingTab("marketing");
      setTimeout(() => {
        setActiveTab("marketing");
        setPulsingTab(null);
      }, 3000);
      return;
    }
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
        .select("id, submitted_at, rating, feedback_text, doctor_id, patient_id, patients(first_name, last_name), staff_users!reviews_doctor_id_fkey(full_name)")
        .eq("visit_id", demoVisitId)
        .not("submitted_at", "is", null)
        .maybeSingle();

      if (data) {
        // Add the new review to the curated list
        const patient = data.patients as any;
        const doctor = data.staff_users as any;
        setDemoReviews((prev) => [
          {
            id: data.id,
            submitted_at: data.submitted_at,
            patient_name: `${patient?.first_name || "Guest"} ${(patient?.last_name || "").charAt(0)}.`,
            doctor_name: doctor?.full_name || null,
            rating: data.rating,
            feedback_text: data.feedback_text,
            sent_to_external: false,
            external_platform: null,
          },
          ...prev,
        ]);
        setReviewSubmitted(true);
        setDemoStep(6);
        setPulsingTab("marketing");
        setTimeout(() => {
          setActiveTab("marketing");
          setPulsingTab(null);
        }, 3000);
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [visitCompleted, demoVisitId, reviewSubmitted, router, features.reviewCollection]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setPulsingTab(null);
  }

  const handleVisitCreated = useCallback((visitId: string) => {
    setDemoVisitId(visitId);
    // Write demo features to visit
    setVisitDemoFeatures(visitId, { ...featuresRef.current });
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
      localStorage.removeItem("demo_campaign_done");
      localStorage.removeItem("demo_campaign_ids");
      sessionStorage.removeItem("demo_visit_id");
    }
    setDemoVisitId(null);
    setWaitingForDoctor(false);
    setPhoneStepDone(false);
    setVisitCompleted(false);
    setVisitClaimed(false);
    setNurseStepDone(false);
    nurseStepDoneRef.current = false;
    setDemoStep(1);
    setReviewToken(null);
    setReviewSubmitted(false);
    setDemoComplete(false);
    setDemoCampaignIds([]);
    setActiveTab("patient");
    // Force CheckinFlow remount with fresh state
    setDemoKey((prev) => prev + 1);
  }

  if (demoComplete) {
    return <DemoComplete onRestart={handleRestart} />;
  }

  // Show intro card before demo starts
  if (!isCustomized) {
    return <DemoIntroCard />;
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
        <div className="w-[130px]" />
      </div>

      {/* Tab bar */}
      <DemoTabBar
        tabs={tabs}
        activeTab={activeTab}
        pulsingTab={pulsingTab}
        onTabClick={handleTabChange}
      />

      {/* Timeline */}
      <DemoTimeline currentStep={demoStep} features={features} nurseActive={features.nurseEnabled && !nurseStepDone && activeTab === "nurse"} nurseDone={nurseStepDone} onFinish={() => setDemoComplete(true)} />



      {/* Content area — all tabs mounted, toggled via display */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-snow" style={{ display: activeTab === "patient" ? "flex" : "none" }}>
          <div className="h-full w-full flex flex-col items-center px-4 pt-6">
            {/* Skip AI banner */}
            {features.skipAi && (
              <div className="w-full max-w-[40rem] mx-auto mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center">
                AI intake is disabled for this demo. Patients will go straight to the doctor queue after approval.
              </div>
            )}
            <div className="flex-1 w-full max-w-[40rem] min-h-0 flex flex-col items-center mx-auto">
              <CheckinFlow
                key={demoKey}
                locationId={locationId}
                locationData={{
                  ...locationData,
                  ask_referral_source: features.askReferralSource,
                  ask_discovery_source: features.askDiscoverySource,
                }}
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
          <RoleProvider value={receptionistRoleValue}>
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
              aiAutoSkipped={features.skipAi}
            />
          </RoleProvider>
        </div>

        <div style={{ display: activeTab === "nurse" ? "block" : "none" }}>
          <NurseDashboard
            key={demoKey}
            mode="dashboard"
            locations={[]}
            staffUserId={staffUserId}
            isOwner={false}
            orgId={orgId}
            locationId={locationId}
            locationName={locationName}
            initialQueue={nurseInitial.queue}
            initialClaimed={nurseInitial.claimed}
            initialCompleted={nurseInitial.completed}
            initialLeft={nurseInitial.left}
            initialHasMoreCompleted={nurseInitial.hasMoreCompleted}
            initialHasMoreLeft={nurseInitial.hasMoreLeft}
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
            nurseEnabled={features.nurseEnabled}
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

            <ReviewHub
              key={`demo-${demoReviews.length}`}
              locations={[{ id: locationId, name: locationName }]}
              isOwnerOrManager={true}
              demoMode={true}
              initialReviews={demoReviews}
              initialStats={demoStats}
            />
          </div>
        </div>

        <div style={{ display: activeTab === "marketing" ? "block" : "none" }}>
          <div className="p-6">
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              This demo uses 200 AI generated fake patients. No real SMS messages are sent.
            </div>
            {demoCampaignIds.length >= DEMO_SCAN_LIMIT && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You have reached the demo scan limit. Sign up to create unlimited campaigns.
              </div>
            )}
            <RoleProvider value={{
              org: {
                id: orgId,
                name: locationData.org_name || "Smith Family Clinic",
                slug: "smith-family-clinic",
                owner_id: "",
                subscription_plan: "professional",
                credits_total: 10000,
                credits_used: 0,
                trial_end_date: "",
                onboarding_completed_at: null,
                cancel_at_period_end: null,
                created_at: "",
                marketing_sms_addon: true,
              } as any,
              roles: [{ role: "marketer", location_id: locationId, location_name: locationName }],
              isOwner: false,
              currentStaffUser: { id: staffUserId, org_id: orgId, auth_uid: "", full_name: "Demo User", username: "demo" },
            }}>
              {selectedCampaignId && selectedCampaignData ? (
                <CampaignDetail initialData={selectedCampaignData} campaignId={selectedCampaignId} onBack={() => { setSelectedCampaignId(null); setSelectedCampaignData(null); }} />
              ) : (
                <MarketingDashboard
                  initialData={marketingInitial}
                  onCampaignSelect={async (id) => {
                    const data = await getCampaignDetail(id);
                    if (data && !("error" in data)) {
                      setSelectedCampaignId(id);
                      setSelectedCampaignData(data);
                      setDemoStep(7);
                      setDemoCampaignIds(prev => {
                        const next = prev.includes(id) ? prev : [...prev, id];
                        localStorage.setItem("demo_campaign_ids", JSON.stringify(next));
                        localStorage.setItem("demo_campaign_done", "true");
                        return next;
                      });
                    }
                  }}
                  demoCampaignIds={demoCampaignIds}
                  demoScanLimitReached={demoCampaignIds.length >= DEMO_SCAN_LIMIT}
                />
              )}
            </RoleProvider>
          </div>
        </div>

        <div style={{ display: activeTab === "faq" ? "block" : "none" }}>
          <DemoFAQ />
        </div>
      </div>

      {/* Gear button for feature customization */}
      <DemoGearButton />
    </div>
  );
}
