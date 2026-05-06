"use client";

import { useState } from "react";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import { PLAN_CONFIG, PARTNER_COMMISSION_RATE } from "@/lib/constants";

export default function AffiliateLandingPage() {
  const [referrals, setReferrals] = useState(10);
  const [planMix, setPlanMix] = useState<"starter" | "professional" | "business">("professional");
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const plan = PLAN_CONFIG[planMix];
  const monthlyPrice = interval === "annual" ? plan.annual : plan.price;
  const monthlyEarnings = referrals * monthlyPrice * PARTNER_COMMISSION_RATE;
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <main className="min-h-screen bg-white text-ink">
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-20 sm:pt-24 sm:pb-32">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-hilt-blue/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-hilt-blue">
              Affiliate Program
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
              Earn 30% lifetime
              <br />
              <span className="text-hilt-blue">on every clinic you refer</span>
            </h1>
            <p className="mt-6 text-lg text-slate sm:text-xl">
              Share Hilt Health with clinics in your network. Get 30% of every payment they make,
              for as long as they stay a customer. No caps, no resets.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/affiliate/signup"
                className="rounded-xl bg-hilt-blue px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-hilt-blue-dark"
              >
                Become a Partner
              </Link>
              <Link
                href="/affiliate/terms"
                className="px-6 py-3 text-sm font-medium text-slate transition-colors hover:text-ink"
              >
                Read the terms
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-[1100px] px-6">
          <FadeIn>
            <h2 className="text-center text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate">
              Two ways to refer. One commission ledger. Track everything in your dashboard.
            </p>
          </FadeIn>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hilt-blue/10 text-sm font-bold text-hilt-blue">1</div>
                <h3 className="mt-4 text-lg font-semibold">Sign up in 30 seconds</h3>
                <p className="mt-2 text-sm text-slate">
                  Email, password, payout details. Verify your email and you are in. No approval queue.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hilt-blue/10 text-sm font-bold text-hilt-blue">2</div>
                <h3 className="mt-4 text-lg font-semibold">Share your code two ways</h3>
                <p className="mt-2 text-sm text-slate">
                  Your <strong>affiliate code</strong> is multi use and grants signups the standard trial (20 credits, no time limit).
                  A <strong>premium trial code</strong> is a targeted invite we email to a specific clinic, granting them the bigger trial (200 credits, no time limit).
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hilt-blue/10 text-sm font-bold text-hilt-blue">3</div>
                <h3 className="mt-4 text-lg font-semibold">Get paid lifetime</h3>
                <p className="mt-2 text-sm text-slate">
                  30% of every payment. Forever. Payouts via PayPal once your balance hits $50.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Earnings calculator */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-[900px] px-6">
          <FadeIn>
            <h2 className="text-center text-3xl font-bold sm:text-4xl">What could you earn?</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-slate">
              Real plan pricing. Real 30% rate. Slide to estimate.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className="text-sm font-medium text-ink">Active referrals</label>
                    <span className="text-2xl font-bold text-hilt-blue">{referrals}</span>
                  </div>
                  <input
                    type="range" min={1} max={50} value={referrals}
                    onChange={(e) => setReferrals(parseInt(e.target.value))}
                    className="mt-3 w-full accent-hilt-blue"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">Plan</label>
                    <div className="flex gap-2">
                      {(["starter", "professional", "business"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPlanMix(k)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                            planMix === k
                              ? "border-hilt-blue bg-hilt-blue/5 text-hilt-blue"
                              : "border-gray-200 text-slate hover:border-gray-300"
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">Billing</label>
                    <div className="flex gap-2">
                      {(["monthly", "annual"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setInterval(k)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                            interval === k
                              ? "border-hilt-blue bg-hilt-blue/5 text-hilt-blue"
                              : "border-gray-200 text-slate hover:border-gray-300"
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate">Per month</p>
                    <p className="mt-1 text-3xl font-bold text-ink">${monthlyEarnings.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate">Per year</p>
                    <p className="mt-1 text-3xl font-bold text-hilt-blue">${yearlyEarnings.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-[800px] px-6">
          <FadeIn>
            <h2 className="text-center text-3xl font-bold sm:text-4xl">Frequently asked</h2>
          </FadeIn>

          <div className="mt-12 space-y-3">
            {[
              {
                q: "How long does the commission last?",
                a: "For the lifetime of the customer. As long as they keep paying, you keep earning 30% of each payment."
              },
              {
                q: "When do I get paid?",
                a: "Each commission has a 30 day hold to cover refund risk. After that, balances over $50 become payable. Payouts go out manually via PayPal as soon as we process them. First commission has a 60 day hold."
              },
              {
                q: "What is the difference between the two code types?",
                a: "An affiliate code is a single multi use code you share publicly. Anyone who signs up with it gets the standard trial (20 credits, no time limit); you get attribution. A premium trial code is targeted at a specific clinic. You enter their email, we email them an 8 character code that grants the bigger trial (200 credits, no time limit). Both attribute commissions to you the same way."
              },
              {
                q: "What if a clinic refunds or cancels?",
                a: "Refunds claw back the corresponding commission. If a clinic cancels, future payments simply stop, so future commissions stop. No clawback for normal cancellations."
              },
              {
                q: "Can I refer my own clinic?",
                a: "No. Self referrals are blocked at signup (matching email, matching domain, matching auth account). Banning happens automatically if velocity rules trigger."
              },
              {
                q: "Do I need to send a 1099?",
                a: "If you are a US partner and cross $600 in lifetime earnings, we collect a W-9 before the next payout. Non US partners are responsible for declaring affiliate income in their own jurisdiction."
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={0.05 * i}>
                <details className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <summary className="cursor-pointer list-none font-semibold">
                    <div className="flex items-center justify-between">
                      <span>{item.q}</span>
                      <span className="text-2xl text-slate transition-transform group-open:rotate-45">+</span>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm text-slate">{item.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-14 text-center">
              <Link
                href="/affiliate/signup"
                className="rounded-xl bg-hilt-blue px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-hilt-blue-dark"
              >
                Become a Partner
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
