"use client";

import { useState, useCallback, useEffect } from "react";
import NoteCard from "./NoteCard";
import {
  addVisitNote,
  addPatientNote,
  updateNotePreference,
  fetchPatientNotes,
} from "@/app/(dashboard)/d/_actions/doctor";

interface Note {
  id: string;
  content: string;
  is_private: boolean;
  author_name: string;
  is_own: boolean;
  created_at: string;
}

interface NotesPanelProps {
  visitId: string;
  patientId: string;
  initialNotes: Note[];
}

export default function NotesPanel({ visitId, patientId, initialNotes }: NotesPanelProps) {
  const [subTab, setSubTab] = useState<"visit" | "patient">("visit");
  const [visitNotes, setVisitNotes] = useState<Note[]>(initialNotes);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [patientNotesLoaded, setPatientNotesLoaded] = useState(false);
  const [patientCursor, setPatientCursor] = useState<string | null>(null);
  const [patientHasMore, setPatientHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [isPrivate, setIsPrivate] = useState<boolean | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatientNotes = useCallback(async (cursor?: string) => {
    setLoadingMore(true);
    const result = await fetchPatientNotes(patientId, cursor);
    if (result.success) {
      if (cursor) {
        setPatientNotes((prev) => [...prev, ...(result.notes || [])]);
      } else {
        setPatientNotes(result.notes || []);
      }
      setPatientHasMore(result.has_more || false);
      setPatientCursor(result.next_cursor || null);
    }
    setLoadingMore(false);
    setPatientNotesLoaded(true);
  }, [patientId]);

  useEffect(() => {
    if (subTab === "patient" && !patientNotesLoaded) {
      loadPatientNotes();
    }
  }, [subTab, patientNotesLoaded, loadPatientNotes]);

  async function handleSubmit() {
    const trimmed = noteText.trim();
    if (!trimmed || submitting) return;
    if (trimmed.length > 10000) {
      setError("Note exceeds 10,000 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = subTab === "visit"
      ? await addVisitNote(visitId, trimmed, isPrivate)
      : await addPatientNote(patientId, trimmed, isPrivate);

    if (result.success) {
      const newNote: Note = {
        id: result.note_id || crypto.randomUUID(),
        content: trimmed,
        is_private: result.is_private ?? isPrivate ?? false,
        author_name: "You",
        is_own: true,
        created_at: new Date().toISOString(),
      };
      if (subTab === "visit") {
        setVisitNotes((prev) => [...prev, newNote]);
      } else {
        setPatientNotes((prev) => [newNote, ...prev]);
      }
      setNoteText("");
    } else {
      setError(result.error || "Failed to add note");
    }
    setSubmitting(false);
  }

  function handlePrivateToggle(checked: boolean) {
    setIsPrivate(checked);
    updateNotePreference(patientId, checked).catch(() => {
      setError("Failed to save preference");
    });
  }

  const notes = subTab === "visit" ? visitNotes : patientNotes;

  return (
    <div>
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSubTab("visit")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            subTab === "visit" ? "bg-hilt-blue text-white" : "bg-gray-100 text-slate hover:bg-gray-200"
          }`}
        >
          Visit Notes
        </button>
        <button
          onClick={() => setSubTab("patient")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            subTab === "patient" ? "bg-hilt-blue text-white" : "bg-gray-100 text-slate hover:bg-gray-200"
          }`}
        >
          Patient Notes
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {subTab === "patient" && !patientNotesLoaded ? (
          <p className="text-sm text-ash text-center py-4">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-ash text-center py-4">No notes yet.</p>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} />)
        )}

        {subTab === "patient" && patientHasMore && (
          <button
            onClick={() => loadPatientNotes(patientCursor || undefined)}
            disabled={loadingMore}
            className="w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-slate hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value.slice(0, 10000))}
          placeholder={`Add a ${subTab} note...`}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y"
        />
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate ?? false}
              onChange={(e) => handlePrivateToggle(e.target.checked)}
              className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
            />
            <span className="text-xs text-slate">Private (only you can see)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ash">{noteText.length}/10,000</span>
            <button
              onClick={handleSubmit}
              disabled={!noteText.trim() || submitting}
              className="rounded-lg bg-hilt-blue px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Adding..." : "Add Note"}
            </button>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
