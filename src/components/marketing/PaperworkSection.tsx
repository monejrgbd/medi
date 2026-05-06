import FadeIn from "@/components/FadeIn";

export default function PaperworkSection() {
  const soapRows = [
    { letter: "S", color: "bg-blue-400", text: "Patient reports two days of sore throat, fever 101.2..." },
    { letter: "O", color: "bg-green-400", text: "Temp 101.2, pharyngeal erythema, no exudate, TMs clear..." },
    { letter: "A", color: "bg-amber-400", text: "Acute viral pharyngitis, low suspicion for strep..." },
    { letter: "P", color: "bg-purple-400", text: "Supportive care, ibuprofen PRN, return if worsening..." },
  ];

  const templates = ["Sick note", "Return to work", "School absence", "Custom"];

  const trustPills = ["Doctor signed", "Audit trail", "BAA compliant"];

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            Documentation
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-ink sm:text-4xl">
            The AI that finishes your paperwork
            <br className="hidden sm:block" />
            <span className="text-hilt-blue"> before you go home.</span>
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-slate">
            Sick notes, work letters, and full SOAP notes drafted from every visit. You review, sign, and close the laptop.
          </p>
        </FadeIn>

        <div className="grid gap-8 sm:grid-cols-3 items-stretch">
          {/* SOAP notes */}
          <FadeIn delay={0} className="h-full">
            <div className="h-full rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4F46E5" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.432V21m-3.5-8h7" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Full clinical notes from the visit</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Hilt already has the transcript, vitals, history, diagnosis, and plan. You dictate the physical exam, Hilt assembles the SOAP note. Copy into your EMR. Done.
              </p>
              {/* Mini SOAP mockup */}
              <div className="mt-auto rounded-xl bg-white/80 p-3 ring-1 ring-indigo-200/60">
                <p className="text-[9px] font-semibold text-indigo-800 mb-2">SOAP Note</p>
                <div className="space-y-1.5">
                  {soapRows.map(row => (
                    <div key={row.letter} className="flex items-start gap-2">
                      <div className={`mt-0.5 h-full w-0.5 shrink-0 rounded-full ${row.color}`} style={{ minHeight: 16 }} />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-ink">{row.letter}</p>
                        <p className="text-[8px] leading-snug text-ash truncate">{row.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="rounded bg-hilt-blue px-2.5 py-1 text-[9px] font-semibold text-white">
                    Sign and Copy to EMR
                  </div>
                  <div className="rounded border border-gray-200 px-2 py-1 text-[9px] font-medium text-slate">
                    Regenerate
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Daily letters */}
          <FadeIn delay={0.12} className="h-full">
            <div className="h-full rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Every sick note, work letter, and school excuse</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Pick a template, Hilt drafts from the visit context, you sign, patient gets it by SMS. Ten to thirty of these a day, handled in seconds each.
              </p>
              {/* Mini template grid */}
              <div className="mt-auto rounded-xl bg-white/80 p-3 ring-1 ring-blue-200/60">
                <p className="text-[9px] font-semibold text-blue-800 mb-2">Templates</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {templates.map(t => (
                    <div
                      key={t}
                      className="rounded-lg border border-blue-200 bg-blue-50/60 px-2 py-1.5 text-center text-[9px] font-medium text-blue-700"
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[8px] text-ash">
                  <svg className="h-2.5 w-2.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  Signed and sent to patient via SMS
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Safe by design */}
          <FadeIn delay={0.24} className="h-full">
            <div className="h-full rounded-2xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">You are always in control</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Every document reviewed and signed by the doctor. Attestation recorded. Audit trail on every access. Clinic branded, license on file, electronically signed.
              </p>
              {/* Trust pills */}
              <div className="mt-auto rounded-xl bg-white/80 p-3 ring-1 ring-amber-200/60">
                <p className="text-[9px] font-semibold text-amber-800 mb-2">Compliance</p>
                <div className="flex flex-wrap gap-1.5">
                  {trustPills.map(pill => (
                    <div
                      key={pill}
                      className="flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-[9px] font-medium text-amber-800"
                    >
                      <svg className="h-2.5 w-2.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {pill}
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[8px] text-ash">
                  <svg className="h-2.5 w-2.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Every action logged with timestamp and actor
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Already included strip */}
        <FadeIn delay={0.36}>
          <div className="mt-12 rounded-xl bg-gray-50 px-6 py-4 text-center">
            <p className="text-sm leading-relaxed text-slate">
              Also included: clinical summaries, cross clinic referrals with full PDF, visit notes, attachments, vaccine records, follow up instructions, audit trail. All clinic branded. All compliant.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
