"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import DemoTabBar from "@/components/demo/DemoTabBar";
import DemoGuide from "@/components/demo/DemoGuide";
import DemoComplete from "@/components/demo/DemoComplete";
import CheckinFlow from "@/app/checkin/[locationId]/CheckinFlow";
import ReceptionistDashboard from "@/app/(dashboard)/d/receptionist/ReceptionistDashboard";
import DoctorDashboard from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface DemoShellProps {
  locationId: string;
  locationData: {
    active: boolean;
    location_name?: string;
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

type Tab = "patient" | "receptionist" | "doctor";

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
    "Welcome! Fill in the check-in form to start the demo."
  );
  const [guideHint, setGuideHint] = useState<string | null>(
    "This is what your patients see when they scan the QR code."
  );
  const [demoComplete, setDemoComplete] = useState(false);

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
            setPulsingTab("receptionist");
            setGuideMessage("A new patient just checked in!");
            setGuideHint(
              "Switch to the Receptionist tab to approve them."
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
            setPulsingTab("patient");
            setGuideMessage("The AI conversation has started!");
            setGuideHint(
              "Switch to the Patient tab to chat with the AI."
            );
            setTimeout(() => {
              setActiveTab("patient");
              setPulsingTab(null);
            }, 3000);
          }

          if (status === "waiting_doctor_claim") {
            setPulsingTab("doctor");
            setGuideMessage("The patient is ready for a doctor!");
            setGuideHint(
              "Switch to the Doctor tab to claim the patient."
            );
            setTimeout(() => {
              setActiveTab("doctor");
              setPulsingTab(null);
            }, 3000);
          }

          if (status === "completed") {
            setDemoComplete(true);
            setGuideMessage(null);
            setGuideHint(null);
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
  }

  function handleDismissGuide() {
    setGuideMessage(null);
    setGuideHint(null);
  }

  function handleRestart() {
    setDemoComplete(false);
    setActiveTab("patient");
    setGuideMessage("Welcome! Fill in the check-in form to start the demo.");
    setGuideHint(
      "This is what your patients see when they scan the QR code."
    );
  }

  if (demoComplete) {
    return <DemoComplete onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen bg-ash flex flex-col">
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pulsingTab={pulsingTab}
      />

      {/* Guide banner */}
      <DemoGuide
        message={guideMessage}
        hint={guideHint}
        onDismiss={handleDismissGuide}
      />

      {/* Content area — all 3 mounted, toggled via display */}
      <div className="flex-1">
        <div style={{ display: activeTab === "patient" ? "block" : "none" }}>
          <CheckinFlow
            locationId={locationId}
            locationData={locationData}
            demoMode={true}
          />
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
          />
        </div>
      </div>
    </div>
  );
}
