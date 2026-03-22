"use client";

const faqs = [
  // About the demo
  {
    q: "Is the AI conversation real?",
    a: "Yes, you are chatting with our AI exactly like a patient would. It adapts its questions based on your answers and remembers returning patients across visits.",
    category: "demo",
  },
  {
    q: "Why am I playing all the roles?",
    a: "This demo lets you experience the full flow. In production, each staff member logs into their own account and only sees their assigned role dashboards.",
    category: "demo",
  },
  // Product
  {
    q: "What languages are supported?",
    a: "Over 130 languages. The patient picks their language and the entire conversation happens in that language. Doctors always see the summary and transcript in English.",
    category: "product",
  },
  {
    q: "Can I customize what the AI asks?",
    a: "Yes. Each location can add custom instructions to the AI prompt and set the conversation length. A dermatology clinic gets skin focused questions. A pediatrics clinic gets age appropriate ones.",
    category: "product",
  },
  {
    q: "What if a patient does not need the AI conversation?",
    a: "Receptionists can skip AI for individual patients with one click. You can also disable AI intake for an entire location or organization. Patients go straight to the doctor queue with no credits charged.",
    category: "product",
  },
  {
    q: "What staff roles are available?",
    a: "Receptionist, doctor, nurse, manager, and marketer. Staff can hold multiple roles per location. Nurses triage patients before the doctor. Managers see analytics. Marketers run SMS campaigns.",
    category: "product",
  },
  {
    q: "How does the review funnel work?",
    a: "After the visit, patients get a text with a link to rate their experience. You set the star threshold. Ratings at or above it are directed to your Google, Yelp, or other review platform. Anything below stays internal so you see the feedback first.",
    category: "product",
  },
  {
    q: "Can I manage multiple locations?",
    a: "Yes. Each location gets its own QR code, staff assignments, feature toggles, and AI settings. The owner dashboard shows everything across all locations.",
    category: "product",
  },
  // Setup and operations
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. Sign up, add your location, configure features, print the QR code, and you are live. No hardware, no app installs, no IT setup needed.",
    category: "setup",
  },
  {
    q: "Can this work on a tablet or kiosk?",
    a: "Yes. Kiosk mode is designed for shared tablets in waiting rooms. It auto resets between patients and locks the device to the check in screen.",
    category: "setup",
  },
  // Pricing
  {
    q: "How does pricing work?",
    a: 'Everything runs on credits. You pay per use, not per feature. Nurse triage, vitals, and vaccines are free. See the full breakdown on our <a href="/pricing" target="_blank" class="text-blue-600 underline">pricing page</a>.',
    category: "pricing",
  },
  {
    q: "Are there monthly fees for features?",
    a: "No. Every feature is available to every clinic automatically. You only pay credits when a feature is actually used. There are no monthly addon fees.",
    category: "pricing",
  },
  // Security
  {
    q: "Is patient data secure?",
    a: "All data is encrypted in transit and at rest. Row level security ensures each clinic can only access their own data. Audit trails track every action. Patients control their own consent.",
    category: "security",
  },
  {
    q: "What if the AI makes a mistake?",
    a: "The AI never diagnoses or suggests treatment to the patient. It only collects information. The patient reviews and approves the summary before it reaches the doctor. The AI diagnostic suggestion is doctor eyes only and clearly labeled as a suggestion.",
    category: "security",
  },
];

const CATEGORIES = [
  { key: "demo", label: "About This Demo" },
  { key: "product", label: "Product" },
  { key: "setup", label: "Setup" },
  { key: "pricing", label: "Pricing" },
  { key: "security", label: "Security and Privacy" },
];

export default function DemoFAQ() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-ink mb-1">Common Questions</h2>
      <p className="text-sm text-slate mb-6">
        Things you might be wondering while trying the demo.
      </p>
      <div className="space-y-6">
        {CATEGORIES.map(({ key, label }) => {
          const items = faqs.filter((f) => f.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="text-xs font-semibold text-ash uppercase tracking-wider mb-2">{label}</h3>
              <div className="space-y-2">
                {items.map((faq, i) => (
                  <details key={i} className="group rounded-lg border border-gray-200 bg-white">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none text-sm font-medium text-ink">
                      {faq.q}
                      <span className="text-gray-400 transition-transform group-open:rotate-90 shrink-0 ml-2">
                        ▸
                      </span>
                    </summary>
                    <div className="px-4 pb-3">
                      <p className="text-sm text-slate leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
