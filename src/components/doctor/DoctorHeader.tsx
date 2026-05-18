"use client";

import { useState, useEffect } from "react";
import { setStaffRoom } from "@/app/(dashboard)/d/_actions/doctor";
import { useRouter } from "next/navigation";
import AddPatientToQueueModal from "@/components/dashboard/AddPatientToQueueModal";

interface DoctorHeaderProps {
  locationName: string;
  queueCount: number;
  claimedCount: number;
  completedCount: number;
  doctorsIn: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  currentRoom?: string | null;
  presetRooms?: string[];
  recentRooms?: string[];
  showRoomToPatients?: boolean;
  locationId?: string | null;
  role?: "doctor" | "owner";
}

export default function DoctorHeader({
  locationName,
  queueCount,
  claimedCount,
  completedCount,
  doctorsIn,
  soundEnabled,
  onToggleSound,
  onToggleFocusMode,
  currentRoom = null,
  presetRooms = [],
  recentRooms = [],
  showRoomToPatients = true,
  locationId = null,
  role = "doctor",
}: DoctorHeaderProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [roomInput, setRoomInput] = useState(currentRoom ?? "");
  const [displayRoom, setDisplayRoom] = useState<string | null>(currentRoom);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayRoom(currentRoom ?? null);
  }, [currentRoom]);

  const stats = [
    { label: "In Queue", value: queueCount, color: "text-amber-600" },
    { label: "Claimed", value: claimedCount, color: "text-blue-600" },
    { label: "Completed", value: completedCount, color: "text-green-600" },
    { label: "Doctors In", value: doctorsIn, color: "text-slate" },
  ];

  const helperText = showRoomToPatients
    ? "Shown to your receptionist, on the queue display, and to patients when you claim them."
    : "Shown only to your receptionist when a patient is claimed.";

  function openEditor() {
    setRoomInput(displayRoom ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    const trimmed = roomInput.trim();
    if (!trimmed) {
      setError("Room name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await setStaffRoom(trimmed);
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Failed to save");
      return;
    }
    setDisplayRoom(res.room ?? trimmed);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">{locationName}</h1>
          {displayRoom ? (
            <button
              onClick={openEditor}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100"
              title="Edit room"
            >
              <span>Room: {displayRoom}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={openEditor}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:border-amber-400 hover:bg-amber-100"
            >
              Set your current room
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {locationId && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-hilt-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Add patient
            </button>
          )}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className="text-sm text-slate hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              aria-label="Enable focus mode"
            >
              Focus Mode
            </button>
          )}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="text-sm text-slate hover:text-ink transition-colors"
              title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            >
              {soundEnabled ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788V15.212a.5.5 0 00.276.447l4.5 2.25a.5.5 0 00.724-.447V6.538a.5.5 0 00-.724-.447l-4.5 2.25A.5.5 0 006.5 8.788z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <label className="block text-sm font-semibold text-ink">Your current room</label>
          {presetRooms.length > 0 ? (
            <select
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
            >
              <option value="">Select a room...</option>
              {presetRooms.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                disabled={saving}
                maxLength={60}
                placeholder="e.g. Room 3"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
              {recentRooms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((room) => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setRoomInput(room)}
                      disabled={saving}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-slate hover:border-hilt-blue hover:text-hilt-blue disabled:opacity-50"
                    >
                      {room}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="text-xs text-ash">{helperText}</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !roomInput.trim()}
              className="rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-slate hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-6 overflow-x-auto">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate">{s.label}</p>
          </div>
        ))}
      </div>

      {showAdd && locationId && (
        <AddPatientToQueueModal
          locationId={locationId}
          role={role}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
