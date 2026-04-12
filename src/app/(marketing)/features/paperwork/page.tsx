import Link from "next/link";
import FadeIn from "@/components/FadeIn";

export const metadata = {
  title: "Clinical Documents | Hilt Health",
  description:
    "AI powered SOAP notes, sick notes, return to work letters, and clinical documents. Doctor reviewed, audit trailed, delivered by SMS.",
};

/* ── Hero ─────────────────────────────────────────────── */

function Hero() {
  return (
    <FadeIn>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-hilt-blue/10">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl tracking-tight">
          The AI that finishes your charting before you go home
        </h1>
        <p className="mt-4 text-lg text-slate max-w-2xl mx-auto">
          Doctors spend more than 15 hours per week on paperwork, according to the AMA.
          Hilt generates your clinical notes, letters, and documents from the visit context you already have, so you can focus on patients instead of keyboards.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Your Free Trial
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}

/* ── Feature Blocks ──────────────────────────────────── */

const FEATURES = [
  {
    title: "SOAP Note Generator",
    description:
      "Full clinical notes from your visit context. You dictate the physical exam, Hilt assembles the rest. Copy into your EMR.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
      </svg>
    ),
    details: [
      "Subjective, Objective, Assessment, and Plan sections generated automatically",
      "Voice or text input for your physical exam findings",
      "Formatted for clean paste into Epic, Athena, Cerner, and others",
    ],
  },
  {
    title: "Daily Letters Suite",
    description:
      "Sick notes, return to work, school absence, work accommodation, travel letters, disability notes. AI drafted, doctor signed, patient delivered by SMS.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
      </svg>
    ),
    details: [
      "One click letter generation from visit context",
      "Clinic branding and doctor credentials on every document",
      "Secure SMS delivery with optional PIN protection",
    ],
  },
  {
    title: "Safe by Design",
    description:
      "Every document reviewed by the doctor before signing. Attestation recorded. Full audit trail. Clinic branded, license on file.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    details: [
      "AI drafts are always editable before signing",
      "Doctor attestation recorded with timestamp",
      "Full audit trail for every document created, edited, and delivered",
    ],
  },
];

function FeatureBlocks() {
  return (
    <div className="space-y-20">
      {FEATURES.map((feat, i) => {
        const reversed = i % 2 === 1;
        return (
          <FadeIn key={feat.title} delay={i * 0.08}>
            <div
              className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16 ${
                reversed ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text side */}
              <div className="flex-1">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-hilt-blue/10 text-hilt-blue">
                  {feat.icon}
                </div>
                <h2 className="mb-2 text-2xl font-bold text-ink">{feat.title}</h2>
                <p className="mb-4 text-slate leading-relaxed">{feat.description}</p>
                <ul className="space-y-2">
                  {feat.details.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-slate">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual side */}
              <div className="flex-1">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hilt-blue/10 text-hilt-blue">
                      {feat.icon}
                    </div>
                    <span className="text-sm font-semibold text-ink">{feat.title}</span>
                  </div>
                  <div className="space-y-2">
                    {feat.details.map((d, j) => (
                      <div key={j} className="flex items-center gap-2 rounded-lg bg-snow px-3 py-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-hilt-blue shrink-0" />
                        <span className="text-xs text-slate">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}

/* ── Time Saved Calculator ───────────────────────────── */

function TimeSaved() {
  return (
    <FadeIn>
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h2 className="mb-2 text-2xl font-bold text-ink">Time saved, every week</h2>
        <p className="text-slate max-w-xl mx-auto mb-6">
          If your clinic sees 20 patients per day and writes 10 letters per day, Hilt saves approximately 8 hours per week on documentation alone.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="rounded-xl bg-snow p-4">
            <p className="text-2xl font-bold text-hilt-blue">20</p>
            <p className="text-xs text-ash">patients per day</p>
          </div>
          <div className="rounded-xl bg-snow p-4">
            <p className="text-2xl font-bold text-hilt-blue">10</p>
            <p className="text-xs text-ash">letters per day</p>
          </div>
          <div className="rounded-xl bg-snow p-4">
            <p className="text-2xl font-bold text-green-600">8 hrs</p>
            <p className="text-xs text-ash">saved per week</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ── Already Included ────────────────────────────────── */

const INCLUDED_ITEMS = [
  "Clinical visit summaries",
  "Referrals with full PDF package",
  "SOAP notes from visit context",
  "Visit notes and annotations",
  "File attachments per visit",
  "Vaccine records",
  "Follow up instructions",
  "Full audit trail",
];

function AlreadyIncluded() {
  return (
    <FadeIn>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ink">Already included on every plan</h2>
        <p className="mt-2 text-slate">No add on fees. No per document charges. The full documentation suite from day one.</p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 max-w-2xl mx-auto">
        {INCLUDED_ITEMS.map((item) => (
          <div key={item} className="flex items-start gap-2 py-1">
            <svg className="h-4 w-4 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-sm text-slate">{item}</span>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

/* ── FAQ ──────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Can I edit the AI draft?",
    a: "Yes. Every draft is fully editable before signing. You have complete control over the final document.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "The AI uses only facts from the visit. If something is missing, it flags it. You review everything before signing.",
  },
  {
    q: "Is this HIPAA compliant?",
    a: "Yes. We maintain BAAs with all AI and infrastructure providers. All data is encrypted in transit and at rest.",
  },
  {
    q: "Which EMRs can I paste into?",
    a: "Any EMR that accepts text paste. We format the note for clean paste into Epic, Athena, Cerner, and others.",
  },
  {
    q: "Do I need to pay extra?",
    a: "No. Clinical documents are included on every plan. There are no per document fees or add on charges.",
  },
];

function FAQSection() {
  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn>
        <h2 className="mb-8 text-center text-2xl font-bold text-ink">Frequently asked questions</h2>
      </FadeIn>
      <div className="space-y-6">
        {FAQS.map((faq, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <div>
              <h3 className="mb-2 font-semibold text-ink">{faq.q}</h3>
              <p className="text-slate leading-relaxed">{faq.a}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

/* ── Bottom CTA ──────────────────────────────────────── */

function BottomCTA() {
  return (
    <FadeIn>
      <div className="text-center">
        <h2 className="mb-3 text-2xl font-bold text-ink">Stop charting after hours</h2>
        <p className="mb-6 text-slate max-w-lg mx-auto">
          Join clinics that finish their documentation before the last patient leaves.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Your Free Trial
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <p className="mt-2 text-sm text-ash">Up to $200 in free credits. No credit card required.</p>
      </div>
    </FadeIn>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default function PaperworkFeaturePage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-blue-50/60 to-white pt-24 pb-20 lg:pt-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <Hero />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <FeatureBlocks />
        </div>
      </section>

      <section className="bg-snow py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <TimeSaved />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <AlreadyIncluded />
        </div>
      </section>

      <section className="bg-snow py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <FAQSection />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <BottomCTA />
        </div>
      </section>
    </main>
  );
}
