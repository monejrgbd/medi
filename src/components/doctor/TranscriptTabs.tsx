"use client";

import { useState } from "react";
import TranscriptView from "./TranscriptView";
import type { PrescreeningData } from "@/types/medical";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

type Section = "chat" | "form" | "scribe";

interface TranscriptTabsProps {
  messages: Message[];
  prescreening: PrescreeningData | null;
  scribeTranscript: string | null;
  aiSkipped?: boolean;
  manuallyAdded?: boolean;
}

function hasFormContent(p: PrescreeningData | null): boolean {
  if (!p || typeof p !== "object") return false;
  const list = (a?: string[]) => Array.isArray(a) && a.length > 0;
  return (
    list(p.medications) ||
    list(p.allergies) ||
    list(p.pets) ||
    p.medications_none === true ||
    p.allergies_none === true ||
    p.pets_none === true ||
    p.pregnancy_asked === true ||
    (!!p.custom_fields && Object.keys(p.custom_fields).length > 0)
  );
}

const PILL_BASE =
  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors";
const PILL_ON = "bg-hilt-blue text-white";
const PILL_OFF = "bg-gray-100 text-slate hover:bg-gray-200";

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate text-center py-8">{text}</p>;
}

/* ── Form responses renderer (defensive: prescreening is untyped jsonb) ── */
function FormResponses({ p }: { p: PrescreeningData | null }) {
  if (!hasFormContent(p) || !p) {
    return <Empty text="No form responses submitted for this visit." />;
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-slate mb-0.5">{label}</p>
      <div className="text-sm text-ink">{value}</div>
    </div>
  );

  const listValue = (arr?: string[], none?: boolean) => {
    if (none === true) return <span className="text-slate">None reported</span>;
    if (Array.isArray(arr) && arr.length > 0) {
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {arr.map((x, i) => (
            <li key={i}>{String(x)}</li>
          ))}
        </ul>
      );
    }
    return <span className="text-ash">Not provided</span>;
  };

  const custom = p.custom_fields ?? {};

  return (
    <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 p-4">
      <Row label="Medications" value={listValue(p.medications, p.medications_none)} />
      <Row label="Allergies" value={listValue(p.allergies, p.allergies_none)} />
      <Row label="Pets" value={listValue(p.pets, p.pets_none)} />
      {p.pregnancy_asked === true && (
        <Row
          label="Pregnant"
          value={
            p.is_pregnant === true
              ? "Yes"
              : p.is_pregnant === false
                ? "No"
                : "Not answered"
          }
        />
      )}
      {Object.entries(custom).map(([id, f]) => (
        <Row
          key={id}
          label={f?.label || "Field"}
          value={
            f?.type === "yes_no"
              ? f.value === true
                ? "Yes"
                : f.value === false
                  ? "No"
                  : "Not answered"
              : listValue(f?.values, f?.none)
          }
        />
      ))}
    </div>
  );
}

export default function TranscriptTabs({
  messages,
  prescreening,
  scribeTranscript,
  aiSkipped,
  manuallyAdded,
}: TranscriptTabsProps) {
  const hasChat = messages.length > 0;
  const hasScribe = !!scribeTranscript && scribeTranscript.trim().length > 0;
  const hasForm = hasFormContent(prescreening);

  // Default to the first source that has content; priority Chat -> Scribe -> Form.
  const [section, setSection] = useState<Section>(() =>
    hasChat ? "chat" : hasScribe ? "scribe" : hasForm ? "form" : "chat"
  );

  const tabs: { key: Section; label: string }[] = [
    { key: "chat", label: "AI Chat" },
    { key: "form", label: "Form Responses" },
    { key: "scribe", label: "AI Scribe" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`${PILL_BASE} ${section === t.key ? PILL_ON : PILL_OFF}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "chat" &&
        (hasChat ? (
          <TranscriptView messages={messages} />
        ) : (
          <Empty
            text={
              manuallyAdded
                ? "Manually added, no AI screening."
                : aiSkipped
                  ? "AI screening was skipped for this visit."
                  : "No AI chat for this visit."
            }
          />
        ))}

      {section === "form" && <FormResponses p={prescreening} />}

      {section === "scribe" &&
        (hasScribe ? (
          <div>
            <p className="text-xs text-ash mb-2">
              AI cleaned transcript, speaker roles estimated by AI, verify against your recollection.
            </p>
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {scribeTranscript}
              </p>
            </div>
          </div>
        ) : (
          <Empty text="No scribe recording for this visit." />
        ))}
    </div>
  );
}
