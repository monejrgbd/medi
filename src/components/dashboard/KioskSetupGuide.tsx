"use client";

import { useState } from "react";
import Link from "next/link";

export default function KioskSetupGuide() {
  const [tab, setTab] = useState<"ipad" | "android">("ipad");

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate mb-2">
        Turn any tablet into a dedicated check-in station for your waiting room.
      </p>

      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">Before You Start</h2>
        <p className="text-sm text-slate mb-4">
          First, generate a Kiosk QR code for your location.
        </p>
        <Link
          href="/d/owner/locations"
          className="inline-flex items-center gap-2 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark transition-colors"
        >
          Go to Locations
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="text-xs text-slate mt-3">
          Navigate to your location &rarr; QR Code tab &rarr; switch to &ldquo;Kiosk QR&rdquo; mode.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("ipad")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "ipad" ? "bg-white text-ink shadow-sm" : "text-slate"
          }`}
        >
          iPad (Guided Access)
        </button>
        <button
          onClick={() => setTab("android")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "android" ? "bg-white text-ink shadow-sm" : "text-slate"
          }`}
        >
          Android Tablet
        </button>
      </div>

      {/* iPad instructions */}
      {tab === "ipad" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">iPad Setup with Guided Access</h2>
          <p className="text-sm text-slate mb-6">
            Guided Access is Apple&apos;s built-in kiosk mode. It locks the iPad to a single app and disables the home button.
          </p>

          <ol className="space-y-4">
            <Step n={1} title="Open Safari on your iPad">
              Use the iPad&apos;s camera to scan the Kiosk QR code from your dashboard.
              The check-in page will open in Safari.
            </Step>
            <Step n={2} title="Enable Guided Access">
              Go to <strong>Settings &rarr; Accessibility &rarr; Guided Access</strong> and toggle it <strong>ON</strong>.
              Set a passcode &mdash; your staff will need this to exit kiosk mode.
            </Step>
            <Step n={3} title="Start Guided Access">
              Return to Safari with the check-in page open.
              <strong> Triple-click the side button</strong> (or Home button on older iPads).
              Tap <strong>&ldquo;Start&rdquo;</strong> in the top-right corner.
            </Step>
            <Step n={4} title="Done">
              The iPad is now locked to the check-in screen. Patients can check in,
              and the screen automatically resets after each visit.
            </Step>
          </ol>

          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-hilt-blue mb-1">To exit kiosk mode</p>
            <p className="text-sm text-slate">
              Triple-click the side button, enter your passcode, and tap <strong>&ldquo;End&rdquo;</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Android instructions */}
      {tab === "android" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Android Setup with Fully Kiosk Browser</h2>
          <p className="text-sm text-slate mb-6">
            Fully Kiosk Browser is a dedicated kiosk app (~$7 one-time purchase) that locks the tablet to a single webpage.
          </p>

          <ol className="space-y-4">
            <Step n={1} title="Install Fully Kiosk Browser">
              Download <strong>Fully Kiosk Browser & Lockdown</strong> from the Google Play Store.
            </Step>
            <Step n={2} title="Enter your kiosk URL">
              Open the app and enter your location&apos;s kiosk URL. You can find this in your
              dashboard under Locations &rarr; QR Code &rarr; Kiosk QR.
            </Step>
            <Step n={3} title="Enable Kiosk Mode">
              In the Fully Kiosk settings, enable <strong>Kiosk Mode</strong> and set a PIN.
              This prevents patients from navigating away.
            </Step>
            <Step n={4} title="Done">
              The tablet is now locked to the check-in screen. The app auto-restarts
              on crash and prevents navigation away.
            </Step>
          </ol>

          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-hilt-blue mb-1">To exit kiosk mode</p>
            <p className="text-sm text-slate">
              Swipe down from the top of the screen and enter your PIN when prompted.
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Tips for Your Kiosk</h2>
        <ul className="space-y-3">
          <Tip title="Keep it plugged in">
            Always connect the tablet to a power source. A kiosk that dies mid-shift is useless.
          </Tip>
          <Tip title="Set brightness to 70-80%">
            High enough to read in a lit waiting room, low enough to avoid burn-in over time.
          </Tip>
          <Tip title="Disable notifications">
            Turn off all notifications on the device so pop-ups don&apos;t interrupt patients.
            On iPad: Settings &rarr; Notifications &rarr; turn off for all apps.
          </Tip>
          <Tip title="Use a stand or mount">
            A tablet stand at reception height makes check-in smoother.
            Wall mounts work well for high-traffic areas.
          </Tip>
          <Tip title="End Session button for stuck sessions">
            If a patient walks away mid-check-in, tap the red &ldquo;End Session&rdquo; button
            in the top-right corner to reset the kiosk for the next patient.
          </Tip>
        </ul>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <div className="flex-none flex h-7 w-7 items-center justify-center rounded-full bg-hilt-blue text-white text-sm font-bold">
        {n}
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-sm text-slate mt-0.5">{children}</p>
      </div>
    </li>
  );
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="flex-none mt-0.5">
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-sm text-slate mt-0.5">{children}</p>
      </div>
    </li>
  );
}
