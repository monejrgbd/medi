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
}

export default function ReceptionistHeader({
  counts,
  locationName,
  onCheckOut,
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
        <button
          onClick={onCheckOut}
          className="text-sm text-slate hover:text-red-600 transition-colors"
        >
          Check Out
        </button>
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
