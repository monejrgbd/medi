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
import MarketingDashboard from "@/components/dashboard/marketing/MarketingDashboard";
import CampaignDetail from "@/components/dashboard/marketing/CampaignDetail";
import { RoleProvider } from "@/contexts/RoleContext";
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
  reviewsInitial: {
    reviews: any[];
    stats: any;
  };
  marketingInitial: any;
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
  marketingInitial,
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
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaignData, setSelectedCampaignData] = useState<any>(null);
  const [demoScanCount, setDemoScanCount] = useState(0);
  const DEMO_SCAN_LIMIT = 3;

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
          {demoStep >= 6 && (
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
              <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-medium text-green-800">Review submitted. Try the Marketing tab next.</p>
                <button
                  onClick={() => { setActiveTab("marketing"); setPulsingTab(null); }}
                  className="shrink-0 rounded-lg bg-hilt-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Go
                </button>
              </div>
            )}

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
              This demo uses 200 AI generated fake patients. No real SMS messages are sent. ({DEMO_SCAN_LIMIT - demoScanCount} scans remaining)
            </div>
            {demoScanCount >= DEMO_SCAN_LIMIT && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You have used all {DEMO_SCAN_LIMIT} demo scans. Sign up to create unlimited campaigns.
              </div>
            )}
            <RoleProvider value={{
              org: {
                id: orgId,
                name: locationData.org_name || "Smith Family Clinic",
                slug: "smith-family-clinic",
                owner_id: "",
                subscription_plan: "standard",
                credits_total: 10000,
                credits_used: 0,
                trial_end_date: "",
                review_sms_addon: true,
                followup_sms_addon: true,
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
                    setDemoScanCount((c) => c + 1);
                    const data = await getCampaignDetail(id);
                    if (data && !("error" in data)) {
                      setSelectedCampaignId(id);
                      setSelectedCampaignData(data);
                    }
                  }}
                  demoScanLimitReached={demoScanCount >= DEMO_SCAN_LIMIT}
                />
              )}
            </RoleProvider>
          </div>
        </div>

        <div style={{ display: activeTab === "faq" ? "block" : "none" }}>
          <DemoFAQ />
        </div>
      </div>
    </div>
  );
}
