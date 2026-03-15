"use client";

import { X } from "lucide-react";

interface DemoGuideProps {
  message: string | null;
  hint?: string | null;
  onDismiss?: () => void;
}

export default function DemoGuide({ message, hint, onDismiss }: DemoGuideProps) {
  if (!message) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">{message}</p>
          {hint && (
            <p className="text-sm text-blue-600 italic mt-0.5">{hint}</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-0.5 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
