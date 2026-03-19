"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import DemoTabBar, { type Tab } from "@/components/demo/DemoTabBar";
import DemoGuide from "@/components/demo/DemoGuide";
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
}: DemoShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("patient");
  const [pulsingTab, setPulsingTab] = useState<string | null>(null);
  const [guideMessage, setGuideMessage] = useState<string | null>(
    "Welcome! Fill in the check in form to start the demo."
  );
  const [guideHint, setGuideHint] = useState<string | null>(
    "This is what your patients see when they scan the QR code. You are given one after you sign up."
  );
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoVisitId, setDemoVisitId] = useState<string | null>(null);
  const [demoKey, setDemoKey] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);
  const [phoneStepDone, setPhoneStepDone] = useState(false);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [visitClaimed, setVisitClaimed] = useState(false);

  // Auto-switch to doctor tab once phone step is complete
  useEffect(() => {
    if (waitingForDoctor && phoneStepDone) {
      setPulsingTab("doctor");
      setGuideMessage("The patient is ready for a doctor!");
      setGuideHint("Switch to the Doctor view to claim the patient.");
      setTimeout(() => {
        setActiveTab("doctor");
        setPulsingTab(null);
      }, 3000);
      setWaitingForDoctor(false);
    }
  }, [waitingForDoctor, phoneStepDone]);

  // Auto-switch back to doctor tab if user leaves while visit is claimed
  useEffect(() => {
    if (!visitClaimed || activeTab === "doctor") return;
    const timer = setTimeout(() => {
      setActiveTab("doctor");
      setGuideMessage("Complete the visit to continue the demo.");
      setGuideHint("Enter a diagnosis and submit to finish the visit.");
    }, 10_000);
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
            if (visitId) setDemoVisitId((prev) => prev ?? visitId);
            setPendingApproval(true);
            setPulsingTab("receptionist");
            setGuideMessage("A new patient just checked in!");
            setGuideHint(
              "Switch to the Receptionist view to approve them. The patient's name and date of birth are how returning patients are identified. You can edit their details by clicking the edit icon next to the status badge."
            );
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
          const status = payload.new?.status;
          const oldStatus = payload.old?.status;

          if (
            status === "still_answering_ai" &&
            oldStatus === "pending_approval"
          ) {
            setPendingApproval(false);
            setPulsingTab("patient");
            setGuideMessage("The AI conversation has started!");
            setGuideHint(
              "Switch to the Patient view to chat with the AI."
            );
            setTimeout(() => {
              setActiveTab("patient");
              setPulsingTab(null);
            }, 3000);
          }

          if (status === "waiting_doctor_claim") {
            // Defer doctor tab switch until patient finishes phone step
            setWaitingForDoctor(true);
          }

          if (status === "in_progress" && oldStatus === "waiting_doctor_claim") {
            setVisitClaimed(true);
          }

          if (status === "completed") {
            setVisitClaimed(false);
            setVisitCompleted(true);
            setPendingApproval(false);
            setPulsingTab("reviews");
            setGuideMessage("Visit complete! The patient receives an SMS with their visit summary and a review request.");
            setGuideHint("Switch to the Reviews tab to see how the review system works.");
            setTimeout(() => {
              setActiveTab("reviews");
              setPulsingTab(null);
              setGuideMessage("Reviews Dashboard");
              setGuideHint("Patients are asked to leave a review via SMS after each visit. You can configure which external platform they are directed to and track all reviews here.");
            }, 4000);
            // Auto-finish after 60s
            setTimeout(() => {
              setDemoComplete(true);
            }, 60_000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setPulsingTab(null);

    // Keep the approval guide message until the receptionist approves
    if (pendingApproval) return;

    if (tab === "patient") {
      setGuideMessage("Patient View");
      setGuideHint("This is what your patients see when they scan the QR code. You are given one after you sign up.");
    } else if (tab === "receptionist") {
      setGuideMessage("Receptionist View");
      setGuideHint("Manage check ins, approve patients, and monitor the queue.");
    } else if (tab === "doctor") {
      setGuideMessage("Doctor View");
      setGuideHint("Claim patients, review AI summaries, and complete visits.");
    } else if (tab === "reviews") {
      setGuideMessage("Reviews Dashboard");
      setGuideHint("This dashboard is accessible by staff with the reviews role. All patients are asked to review via SMS after their visit. You can configure which external platform they are directed to, and re request a review on a different platform if needed.");
    } else if (tab === "faq") {
      setGuideMessage(null);
      setGuideHint(null);
    }
  }

  const handleVisitCreated = useCallback((visitId: string) => {
    setDemoVisitId(visitId);
  }, []);

  const handlePhoneComplete = useCallback(() => {
    setPhoneStepDone(true);
  }, []);

  function handleRestart() {
    // Clear patient session from localStorage so CheckinFlow starts fresh
    if (typeof window !== "undefined") {
      localStorage.removeItem("hilt_session_token");
      localStorage.removeItem("hilt_session_phone");
    }
    setDemoVisitId(null);
    setPendingApproval(false);
    setWaitingForDoctor(false);
    setPhoneStepDone(false);
    setVisitCompleted(false);
    setVisitClaimed(false);
    setDemoComplete(false);
    setActiveTab("patient");
    setGuideMessage("Welcome! Fill in the check in form to start the demo.");
    setGuideHint(
      "This is what your patients see when they scan the QR code. You are given one after you sign up."
    );
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

      {/* Guide banner */}
      <DemoGuide
        message={guideMessage}
        hint={guideHint}
      />


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
            <ReviewHub
              locations={[{ id: locationId, name: locationName }]}
              isOwnerOrManager={true}
              demoMode={true}
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
