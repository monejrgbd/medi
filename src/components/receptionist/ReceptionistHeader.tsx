"use client";

interface Counts {
  awaiting: number;
  with_ai: number;
  in_queue: number;
  with_doctor: number;
  tablets_out: number;
  doctors_checked_in: number;
}

interface ReceptionistHeaderProps {
  counts: Counts;
  locationName: string;
  onCheckOut: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function ReceptionistHeader({
  counts,
  locationName,
  onCheckOut,
  soundEnabled,
  onToggleSound,
}: ReceptionistHeaderProps) {
  const items = [
    { label: "Awaiting", value: counts.awaiting, color: "text-yellow-600" },
    { label: "With AI", value: counts.with_ai, color: "text-blue-600" },
    { label: "In Queue", value: counts.in_queue, color: "text-purple-600" },
    { label: "With Doctor", value: counts.with_doctor, color: "text-indigo-600" },
    { label: "Tablets Out", value: counts.tablets_out, color: "text-orange-600" },
    { label: "Doctors In", value: counts.doctors_checked_in, color: "text-green-600" },
  ];

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-ink">{locationName}</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={onCheckOut}
            className="text-sm text-slate hover:text-red-600 transition-colors"
          >
            Check Out
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-sm">
            <span className={`font-semibold ${item.color}`}>{item.value}</span>
            <span className="text-ash">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
