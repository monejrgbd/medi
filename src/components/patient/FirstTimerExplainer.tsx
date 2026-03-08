"use client";

import { useState } from "react";

interface FirstTimerExplainerProps {
  onContinue: () => void;
}

export default function FirstTimerExplainer({
  onContinue,
}: FirstTimerExplainerProps) {
  const [consented, setConsented] = useState(false);

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold text-ink mb-4 text-center">
        Welcome to Your Visit
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">1.</span>
          <p className="text-sm text-slate">
            You will answer a series of questions about your symptoms and medical
            history with our AI assistant. This helps your doctor prepare for
            your visit.
          </p>
        </div>

        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">2.</span>
          <p className="text-sm text-slate">
            Your responses are shared only with the medical staff at this clinic.
            The AI does not make any diagnoses or treatment decisions.
          </p>
        </div>

        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">3.</span>
          <p className="text-sm text-slate">
            You can skip any question you are not comfortable answering. The
            conversation typically takes 3-5 minutes.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
        />
        <span className="text-sm text-slate">
          I understand and agree to the{" "}
          <a
            href="/privacy"
            target="_blank"
            className="text-hilt-blue underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/terms"
            target="_blank"
            className="text-hilt-blue underline"
          >
            Terms of Service
          </a>
          .
        </span>
      </label>

      <button
        onClick={onContinue}
        disabled={!consented}
        className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
