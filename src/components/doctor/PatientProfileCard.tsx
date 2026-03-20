"use client";

interface PatientProfileCardProps {
  patient: {
    first_name: string;
    last_name: string;
    birthday: string;
    sex?: string;
    phone_masked: string | null;
    medications: { name: string }[];
    allergies: { name: string }[];
    chronic_conditions: { name: string }[];
    pets?: { name: string }[];
    visit_count: number;
    last_visit_date: string | null;
    last_visit_summary: string | null;
  };
}

export default function PatientProfileCard({
  patient,
}: PatientProfileCardProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.birthday).getTime()) / 31557600000
  );

  const pets = patient.pets || [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">
            {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-sm text-slate">
            {age} year old {patient.sex || ""}
          </p>
        </div>
        {patient.visit_count > 0 && (
          <span className="text-xs text-slate">
            {patient.visit_count} past visit{patient.visit_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Medications */}
        <div>
          <h4 className="flex items-center gap-1 text-xs font-medium text-slate mb-1">
            Medications ({patient.medications.length})
          </h4>
          {patient.medications.length === 0 ? (
            <p className="text-xs text-ash">None reported</p>
          ) : (
            <ul className="space-y-0.5">
              {patient.medications.map((m, i) => (
                <li key={i} className="text-xs text-ink">
                  {m.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Allergies */}
        <div>
          <h4
            className={`flex items-center gap-1 text-xs font-medium mb-1 ${
              patient.allergies.length > 0 ? "text-red-600" : "text-slate"
            }`}
          >
            Allergies ({patient.allergies.length})
          </h4>
          {patient.allergies.length === 0 ? (
            <p className="text-xs text-ash">None reported</p>
          ) : (
            <ul className="space-y-0.5">
              {patient.allergies.map((a, i) => (
                <li key={i} className="text-xs text-ink">
                  {a.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chronic conditions */}
        <div>
          <h4 className="flex items-center gap-1 text-xs font-medium text-slate mb-1">
            Chronic ({patient.chronic_conditions.length})
          </h4>
          {patient.chronic_conditions.length === 0 ? (
            <p className="text-xs text-ash">None reported</p>
          ) : (
            <ul className="space-y-0.5">
              {patient.chronic_conditions.map((c, i) => (
                <li key={i} className="text-xs text-ink">
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pets at home */}
        <div>
          <h4 className="flex items-center gap-1 text-xs font-medium text-slate mb-1">
            Pets ({pets.length})
          </h4>
          {pets.length === 0 ? (
            <p className="text-xs text-ash">None reported</p>
          ) : (
            <ul className="space-y-0.5">
              {pets.map((p, i) => (
                <li key={i} className="text-xs text-ink">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {patient.last_visit_summary && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-slate mb-1">
            Last visit &middot;{" "}
            {patient.last_visit_date
              ? new Date(patient.last_visit_date).toLocaleDateString()
              : ""}
          </p>
          <p className="text-xs text-ink line-clamp-2">
            {patient.last_visit_summary}
          </p>
        </div>
      )}
    </div>
  );
}
