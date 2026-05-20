import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import TrustSignal from "@/components/marketing/country/TrustSignal";

/**
 * Shared social-proof band: country-aware presence line + clinic marquee +
 * headline stats. Used on the homepage (under the tour) and under the hero on
 * each /features page.
 */
export default function SocialProofSection() {
  const clinics = [
    "Hartwell Family Medicine",
    "Okafor Pediatrics",
    "Caldwell Medical Associates",
    "Mercer Internal Medicine",
    "Delgado Primary Care",
    "Glenwood Family Health",
    "Harbor Point Medical Group",
    "Brookline Walk In Care",
    "Westside Health",
    "North Loop Family Practice",
    "Tri County Urgent Care",
    "Midtown Community Health",
    "Allied Orthopedics",
    "Vista Dermatology",
    "Brightleaf Wellness",
    "Cedar Hollow Behavioral Health",
    "Maplewood Health Partners",
    "Sage Medicine",
  ];

  return (
    <section className="bg-snow py-16 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-10 text-center text-xl font-bold tracking-tight text-ink sm:text-2xl">
            <TrustSignal />
          </p>
        </FadeIn>

        {/* Marquee */}
        <div
          className="relative mb-14 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
          aria-hidden="true"
        >
          <div className="logo-carousel flex w-max gap-x-14">
            {[...clinics, ...clinics].map((name, i) => (
              <span key={i} className="shrink-0 whitespace-nowrap text-base font-medium tracking-tight text-slate sm:text-lg">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats — inline, no card */}
        <FadeIn>
          <div className="flex flex-col items-center gap-7 text-center">
            <div className="flex flex-wrap items-end justify-center gap-x-14 gap-y-6 sm:gap-x-24">
              <div>
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">2M+</p>
                <p className="mt-1.5 text-sm font-medium text-ash">Patients Screened</p>
              </div>
              <div>
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">8 min</p>
                <p className="mt-1.5 text-sm font-medium text-ash">Saved Per Patient</p>
              </div>
            </div>

            <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
              <Link
                href="/integrations"
                className="group flex items-center gap-4 rounded-2xl border-2 border-blue-100 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-hilt-blue/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink sm:text-base">Integrates with your EHR/EMR</p>
                  <p className="mt-0.5 text-xs font-semibold text-hilt-blue group-hover:underline">Learn more →</p>
                </div>
              </Link>
              <Link
                href="/migrate"
                className="group flex items-center gap-4 rounded-2xl border-2 border-green-100 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-green-500/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink sm:text-base">Free data migration</p>
                  <p className="mt-0.5 text-xs font-semibold text-green-700 group-hover:underline">Learn more →</p>
                </div>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
