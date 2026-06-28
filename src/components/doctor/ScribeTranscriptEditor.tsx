"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchScribeTurns, saveScribeTurns } from "@/app/(dashboard)/d/_actions/scribe";
import { SPEAKER_ROLES } from "@/lib/constants";
import { buildSpeakerDisplayMap, type ScribeTurn } from "@/lib/scribeTurns";

interface Props {
  visitId: string;
  fallbackTranscript: string | null;
}

interface SpeakerInfo {
  speaker: string;
  role: string;
  label: string | null;
}

// Whole-speaker relabel: a chip per distinct speaker, expandable to set the
// role + optional name for everything that speaker said.
function SpeakerChip({
  info,
  display,
  onRelabel,
}: {
  info: SpeakerInfo;
  display: string;
  onRelabel: (speaker: string, role: string, label: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(info.role);
  const [name, setName] = useState(info.label ?? "");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setRole(info.role);
          setName(info.label ?? "");
          setOpen((v) => !v);
        }}
        className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-ink hover:border-hilt-blue"
      >
        {display}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <label className="mb-1 block text-[11px] font-semibold text-slate">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-hilt-blue focus:outline-none"
          >
            {SPEAKER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <label className="mb-1 block text-[11px] font-semibold text-slate">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Chen"
            className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-hilt-blue focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs text-slate hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onRelabel(info.speaker, role, name.trim() ? name.trim() : null);
                setOpen(false);
              }}
              className="rounded-lg bg-hilt-blue px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// One contiguous speaker turn. Tap to edit its text or reassign who said it.
function TurnRow({
  turn,
  display,
  speakers,
  displayMap,
  editing,
  onEdit,
  onClose,
  onText,
  onReassign,
}: {
  turn: ScribeTurn;
  display: string;
  speakers: SpeakerInfo[];
  displayMap: Record<string, string>;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onText: (idx: number, text: string) => void;
  onReassign: (idx: number, speaker: string) => void;
}) {
  return (
    <div className="rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          {display}
          {turn.low_confidence && (
            <span
              title="Attribution inferred — please verify"
              className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
            >
              review
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={editing ? onClose : onEdit}
          className="text-[11px] text-hilt-blue hover:underline"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={turn.text}
            onChange={(e) => onText(turn.idx, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate">Said by</span>
            <select
              value={turn.speaker}
              onChange={(e) => onReassign(turn.idx, e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-hilt-blue focus:outline-none"
            >
              {speakers.map((s) => (
                <option key={s.speaker} value={s.speaker}>
                  {displayMap[s.speaker]}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{turn.text}</p>
      )}
    </div>
  );
}

export default function ScribeTranscriptEditor({ visitId, fallbackTranscript }: Props) {
  const [loading, setLoading] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ScribeTurn[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await fetchScribeTurns(visitId);
      if (!active) return;
      if (r.success && Array.isArray(r.turns)) {
        setDocumentId(r.documentId ?? null);
        setTurns((r.turns as ScribeTurn[]).map((t, i) => ({ ...t, idx: i })));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [visitId]);

  const displayMap = useMemo(() => buildSpeakerDisplayMap(turns), [turns]);
  const speakers = useMemo<SpeakerInfo[]>(() => {
    const seen = new Set<string>();
    const out: SpeakerInfo[] = [];
    for (const t of turns) {
      if (!seen.has(t.speaker)) {
        seen.add(t.speaker);
        out.push({ speaker: t.speaker, role: t.role, label: t.label });
      }
    }
    return out;
  }, [turns]);

  function relabelSpeaker(speaker: string, role: string, label: string | null) {
    setTurns((prev) => prev.map((t) => (t.speaker === speaker ? { ...t, role, label } : t)));
    setDirty(true);
    setSaved(false);
  }
  function reassignTurn(idx: number, newSpeaker: string) {
    const target = speakers.find((s) => s.speaker === newSpeaker);
    setTurns((prev) =>
      prev.map((t) =>
        t.idx === idx
          ? { ...t, speaker: newSpeaker, role: target?.role ?? t.role, label: target?.label ?? null }
          : t
      )
    );
    setDirty(true);
    setSaved(false);
  }
  function editTurnText(idx: number, text: string) {
    setTurns((prev) => prev.map((t) => (t.idx === idx ? { ...t, text } : t)));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!documentId || saving) return;
    setSaving(true);
    const r = await saveScribeTurns(documentId, turns);
    setSaving(false);
    if (r.success) {
      setDirty(false);
      setSaved(true);
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-sm text-slate">Loading transcript…</p>;
  }

  // No structured turns (e.g. a pre-upgrade recording): show the flat transcript.
  if (turns.length === 0) {
    if (fallbackTranscript && fallbackTranscript.trim().length > 0) {
      return (
        <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{fallbackTranscript}</p>
        </div>
      );
    }
    return <p className="py-6 text-center text-sm text-slate">No scribe recording for this visit.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-ash">
          Speaker identity is verified by voice where a clinician is enrolled. Tap a turn to fix its
          text or who said it; tap a speaker to relabel everything they said.
        </p>
        {dirty ? (
          <button
            type="button"
            onClick={save}
            disabled={saving || !documentId}
            className="shrink-0 rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        ) : saved ? (
          <span className="shrink-0 text-xs font-medium text-green-600">Saved</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {speakers.map((s) => (
          <SpeakerChip
            key={s.speaker}
            info={s}
            display={displayMap[s.speaker]}
            onRelabel={relabelSpeaker}
          />
        ))}
      </div>

      <div className="max-h-[600px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {turns.map((t) => (
          <TurnRow
            key={t.idx}
            turn={t}
            display={displayMap[t.speaker]}
            speakers={speakers}
            displayMap={displayMap}
            editing={editingIdx === t.idx}
            onEdit={() => setEditingIdx(t.idx)}
            onClose={() => setEditingIdx(null)}
            onText={editTurnText}
            onReassign={reassignTurn}
          />
        ))}
      </div>
    </div>
  );
}
