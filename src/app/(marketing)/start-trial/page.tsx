import Link from "next/link";
import { CheckCircle } from "lucide-react";
import ContactLink from "@/components/marketing/ContactLink";

export const metadata = {
  title: "Start Your Free Trial — Hilt Health",
  description: "Get up to $200 in free credits. AI pre-screening for your walk-in clinic.",
};

export default function StartTrialPage() {
  const features = [
    "AI patient pre-screening",
    "130+ language support",
    "Real-time doctor dashboard",
    "SMS notifications & summaries",
    "Referral management",
    "Analytics & reporting",
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:pt-32">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">
          Start your free trial
        </h1>
        <p className="mt-3 text-lg text-slate">
          No credit card required. Full access to every feature.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Standard */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-ink">Standard</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            $20 <span className="text-base font-normal text-slate">in credits</span>
          </p>
          <p className="text-sm text-slate mt-1">14-day trial</p>

          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-6 block rounded-lg bg-hilt-blue py-3 text-center text-sm font-semibold text-white shadow-md shadow-hilt-blue/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Start Standard Trial
          </Link>
        </div>

        {/* Premium */}
        <div className="relative rounded-2xl border-2 border-hilt-blue bg-hilt-blue/5 p-6 shadow-sm">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-hilt-blue px-3 py-1 text-[11px] font-semibold text-white">
            Recommended
          </span>
          <p className="text-lg font-bold text-ink">Premium</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            $200 <span className="text-base font-normal text-slate">in credits</span>
          </p>
          <p className="text-sm text-slate mt-1">30-day trial</p>

          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm font-medium text-hilt-blue">
              <CheckCircle className="w-4 h-4 text-hilt-blue shrink-0" />
              10x more credits to evaluate
            </li>
          </ul>

          <ContactLink
            className="mt-6 block rounded-lg border-2 border-hilt-blue py-3 text-center text-sm font-semibold text-hilt-blue transition-all hover:bg-hilt-blue hover:text-white"
          >
            Apply for Premium Trial
          </ContactLink>
        </div>
      </div>

      <p className="text-center mt-8 text-sm text-slate">
        Need a custom plan?{" "}
        <Link href="/pricing" className="text-hilt-blue hover:text-hilt-blue-dark font-medium">
          View all pricing options
        </Link>
      </p>
    </div>
  );
}
