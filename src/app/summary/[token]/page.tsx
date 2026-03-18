import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ token: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getSummary(token: string) {
  if (!UUID_RE.test(token)) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase.rpc("get_visit_summary_public", {
    p_token: token,
  });

  if (error || !data?.success) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const summary = await getSummary(token);

  if (!summary) {
    return { title: "Visit Summary" };
  }

  return {
    title: `Visit Summary — ${summary.clinic_name}`,
  };
}

export default async function SummaryPage({ params }: PageProps) {
  const { token } = await params;
  const summary = await getSummary(token);

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Summary Not Available
          </h1>
          <p className="text-gray-600">
            This summary link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const visitDate = summary.visit_date
    ? new Date(summary.visit_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const medications: { name: string }[] = summary.medications ?? [];
  const allergies: { name: string }[] = summary.allergies ?? [];
  const chronicConditions: { name: string }[] =
    summary.chronic_conditions ?? [];
  const pets: { name: string }[] = summary.pets ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Clinic header */}
        <div className="flex items-center gap-3 mb-6">
          {summary.clinic_logo_url && (
            <img
              src={summary.clinic_logo_url}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {summary.clinic_name}
            </h1>
            {summary.clinic_address && (
              <p className="text-sm text-gray-500">{summary.clinic_address}</p>
            )}
          </div>
        </div>

        {/* Visit info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Visit Summary
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            {visitDate && <span>{visitDate}</span>}
            {summary.doctor_name && <span>Dr. {summary.doctor_name}</span>}
          </div>

          {/* Summary */}
          {summary.summary && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Summary
              </h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {summary.summary}
              </p>
            </div>
          )}

          {/* Diagnosis */}
          {summary.diagnosis && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                Diagnosis
              </h3>
              <p className="text-sm text-green-900 whitespace-pre-wrap">
                {summary.diagnosis}
              </p>
            </div>
          )}

          {/* No content fallback */}
          {!summary.summary && !summary.diagnosis && (
            <p className="text-sm text-gray-500 italic">
              No summary details available for this visit.
            </p>
          )}
        </div>

        {/* Medical info */}
        {(medications.length > 0 ||
          allergies.length > 0 ||
          chronicConditions.length > 0 ||
          pets.length > 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Medical Information
            </h3>

            {medications.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Medications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {medications.map((m, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {allergies.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Allergies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {chronicConditions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Chronic Conditions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chronicConditions.map((c, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Pets at Home
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pets.map((p, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <a
            href="https://hilthealth.com"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by Hilt Health
          </a>
        </div>
      </div>
    </div>
  );
}
