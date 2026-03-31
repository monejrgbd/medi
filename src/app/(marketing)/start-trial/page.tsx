import Link from "next/link";
import ContactLink from "@/components/marketing/ContactLink";

export const metadata = {
  title: "Start Your Free Trial — Hilt Health",
  description: "Try Hilt Health free. Pay as you go with up to $200 in credits, or start a subscription trial.",
};

export default function StartTrialPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:pt-32">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">
          Start your free trial
        </h1>
        <p className="mt-3 text-lg text-slate">
          Choose how you would like to try Hilt Health.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Pay As You Go */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-ink">Pay As You Go</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            Up to $200 <span className="text-base font-normal text-slate">in credits</span>
          </p>
          <p className="text-sm text-slate mt-1">14 to 30 day trial</p>

          <ul className="mt-4 space-y-2 text-sm text-slate">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              No credit card required
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              $20 free credits to start (up to $200 with approval code)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Pay per patient with credits
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Full access to every feature
            </li>
          </ul>

          <Link
            href="/signup?trial=payg"
            className="mt-6 block rounded-lg bg-gray-900 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800"
          >
            Start Pay As You Go
          </Link>
        </div>

        {/* Subscription Plans */}
        <div className="relative rounded-2xl border-2 border-hilt-blue bg-hilt-blue/5 p-6 shadow-sm">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-hilt-blue px-3 py-1 text-[11px] font-semibold text-white">
            Recommended
          </span>
          <p className="text-lg font-bold text-ink">Subscription Plans</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            14 days <span className="text-base font-normal text-slate">free</span>
          </p>
          <p className="text-sm text-slate mt-1">Then per provider pricing</p>

          <ul className="mt-4 space-y-2 text-sm text-slate">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Unlimited AI screening
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Up to 5 providers during trial
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Starter plan free, Professional with approval code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Cancel anytime during trial
            </li>
          </ul>

          <Link
            href="/signup?trial=plans"
            className="mt-6 block rounded-lg bg-hilt-blue py-3 text-center text-sm font-semibold text-white shadow-md shadow-hilt-blue/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Start Subscription Trial
          </Link>
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
