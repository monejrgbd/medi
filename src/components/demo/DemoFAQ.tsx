"use client";

const faqs = [
  {
    q: "Am I controlling all three roles?",
    a: "Yes! In this demo, you play all three roles to see the full flow. In production, each staff member logs into their own account and only sees their role dashboard.",
  },
  {
    q: "Does one staff member have access to all roles?",
    a: "Staff can be assigned one or multiple roles (receptionist, doctor, manager) per location by the clinic owner. They see dashboards for all their assigned roles. Owners can see everything.",
  },
  {
    q: "Is the AI conversation real?",
    a: "Yes, you are chatting with our AI exactly like a patient would. It adapts its questions based on your answers.",
  },
  {
    q: "How does the QR code work in a real clinic?",
    a: "After signing up, you get a branded QR code for each location. Print it and display it in your waiting room. Patients scan it on their phone to start the check in, no app download needed.",
  },
  {
    q: "What languages are supported?",
    a: "Over 130 languages. The patient picks their language and the entire conversation happens in that language. The doctor always sees the summary in English.",
  },
{
    q: "How does the doctor get notified?",
    a: "In production, doctors get browser notifications and audio chimes when a patient is ready. They see the AI generated summary before walking into the room.",
  },
  {
    q: "Can this work on a tablet or kiosk?",
    a: "Yes, there is a kiosk mode designed for shared tablets in waiting rooms. It auto resets between patients and locks the device to the check in screen.",
  },
{
    q: "Do these tabs show in the actual system?",
    a: "No, the tabs are only for this demo so you can experience all three roles. In the real system, each user logs into their own dashboard and only sees their role.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. Sign up, add your location, print the QR code, and you are live. No hardware or IT setup needed.",
  },
];

export default function DemoFAQ() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-ink mb-1">Common Questions</h2>
      <p className="text-sm text-slate mb-6">
        Things you might be wondering while trying the demo.
      </p>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-lg border border-gray-200 bg-white">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none text-sm font-medium text-ink">
              {faq.q}
              <span className="text-gray-400 transition-transform group-open:rotate-90 shrink-0 ml-2">
                ▸
              </span>
            </summary>
            <div className="px-4 pb-3">
              <p className="text-sm text-slate leading-relaxed">{faq.a}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
