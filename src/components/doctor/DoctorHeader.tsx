"use client";

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
}: DoctorHeaderProps) {
  const stats = [
    { label: "In Queue", value: queueCount, color: "text-amber-600" },
    { label: "Claimed", value: claimedCount, color: "text-blue-600" },
    { label: "Completed", value: completedCount, color: "text-green-600" },
    { label: "Doctors In", value: doctorsIn, color: "text-slate" },
  ];

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{locationName}</h1>
        <div className="flex items-center gap-3">
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
      <div className="mt-3 flex gap-6 overflow-x-auto">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
