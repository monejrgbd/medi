"use client";

import { useState, useEffect, useRef } from "react";
import { fetchDemoProgress } from "@/app/demo/_actions/track";

interface StepTalkingPoints {
  keyPoints: string[];
  lines: string[];
}

const TALKING_POINTS: Record<number, StepTalkingPoints> = {
  1: { keyPoints: [], lines: [] },
  2: {
    keyPoints: [
      "No app install, works on any phone",
      "130+ languages, doctor still sees English",
      "Skip AI button for simple visits (no credits)",
      "Returning patients auto matched",
    ],
    lines: [
      "That form they just filled out works in 130 plus languages. The doctor still reads everything in English.",
      "Notice the Skip AI button. If this patient is here for a flu shot, skip the conversation entirely. Straight to the doctor, no credits used.",
    ],
  },
  3: {
    keyPoints: [
      "AI follows up on vague answers, does not stop at surface level",
      "Urgent symptoms get flagged and moved ahead in queue",
      "Returning patients: AI has their history, confirms and updates",
    ],
    lines: [
      "Watch how it follows up. It does not stop at 'my knee hurts.' It asks which knee, how long, what makes it worse.",
      "If she mentioned chest pain right now, the system would flag her as urgent and move her ahead of everyone.",
    ],
  },
  4: {
    keyPoints: [
      "Summary is patient verified, not a guess",
      "AI diagnostic is doctor eyes only, patient never sees it",
      "Nurse vitals and vaccines show up here (if enabled)",
      "Care instructions go straight to patient by text",
      "Follow up instructions carry to the next visit via AI",
    ],
    lines: [
      "That summary was verified by the patient before the doctor saw it. Not a guess, a confirmed record.",
      "The diagnostic suggestion at the bottom? She never sees that. Doctor eyes only.",
      "When they complete, they can write care instructions. 'Rest 48 hours, take ibuprofen twice daily.' Goes straight to the patient by text.",
    ],
  },
  5: {
    keyPoints: [
      "Patient gets permanent visit summary link by SMS",
      "5 stars route to Google/Yelp, below 5 stays internal",
      "Platform rotation is automatic",
    ],
    lines: [
      "She gets a permanent link to her visit summary. She keeps that forever. She can show it to any doctor.",
      "Five stars go to your Google page. Below that stays internal. Your public rating only goes up.",
    ],
  },
  6: {
    keyPoints: [
      "AI scans patient clinical data to find exact matches",
      "Describe who you want in plain English",
      "Simple filtering is free, AI scan is 1 credit per 1K patients",
    ],
    lines: [
      "Type what you are looking for. 'Patients over 65 who missed their flu shot.' The AI scans their records and builds the list.",
      "Simple filtering by age and visit date is always free. The AI scan costs 1 credit per thousand patients.",
    ],
  },
};

const STEP_LABELS = ["", "Check In", "Approve", "AI Screening", "Diagnose", "Review", "Outreach"];

interface Session {
  visitId: string;
  patientName: string;
  status: string;
  step: number;
  stepLabel: string;
  messageCount: number;
  startedAt: string;
}

export default function DemoTrackPage() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamCodeRef = useRef("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.length < 2) return;
    teamCodeRef.current = code;
    setVerified(true);
    poll(code);
  }

  async function poll(teamCode: string) {
    const result = await fetchDemoProgress(teamCode);
    setSessions(result.sessions);
    setEmails(result.emails);
  }

  useEffect(() => {
    if (!verified) return;
    intervalRef.current = setInterval(() => poll(teamCodeRef.current), 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [verified]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-24 px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Demo Tracker</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your team code to track live demo sessions.</p>
          <form onSubmit={handleVerify}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. HK001"
              className="w-full px-4 py-2.5 mb-3 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono tracking-widest text-center text-lg"
              autoFocus
            />
            <button
              type="submit"
              disabled={!code || code.length < 2}
              className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => s.status !== "completed");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Tracker</h1>
            <p className="text-sm text-gray-500">Code: {teamCodeRef.current}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Polling every 3s</span>
          </div>
        </div>

        {emails.length > 0 && (
          <div className="mb-4 text-xs text-gray-400">
            Prospects: {emails.join(", ")}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No active demo sessions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Waiting for a prospect to start the demo with your link.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((s) => (
              <SessionCard key={s.visitId} session={s} />
            ))}
            {completedSessions.map((s) => (
              <SessionCard key={s.visitId} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const tp = TALKING_POINTS[session.step] || { keyPoints: [], lines: [] };
  const isComplete = session.status === "completed";

  return (
    <div className={`bg-white rounded-xl border ${isComplete ? "border-green-200" : "border-blue-200"} overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 ${isComplete ? "bg-green-50" : "bg-blue-50"} border-b ${isComplete ? "border-green-100" : "border-blue-100"}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">{session.patientName || "Unknown"}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isComplete ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {session.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  n < session.step
                    ? "bg-green-500 text-white"
                    : n === session.step
                      ? "bg-blue-600 text-white ring-2 ring-blue-200"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {n < session.step ? "✓" : n}
              </div>
              {n < 6 && (
                <div className={`w-3 h-0.5 ${n < session.step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">{STEP_LABELS[session.step]}</span>
        </div>

        {session.step === 3 && (
          <p className="text-xs text-gray-400 mb-3">{session.messageCount} messages in AI conversation</p>
        )}

        {/* Key points — must deliver */}
        {tp.keyPoints.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Key points</p>
            <ul className="space-y-1">
              {tp.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optional lines — can say verbatim */}
        {tp.lines.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">You could say</p>
            <div className="space-y-1.5">
              {tp.lines.map((line, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <p className="text-sm text-amber-900 leading-relaxed">&ldquo;{line}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
