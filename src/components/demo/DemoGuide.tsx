"use client";

interface DemoGuideProps {
  message: string | null;
  hint?: string | null;
}

export default function DemoGuide({ message, hint }: DemoGuideProps) {
  if (!message) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-medium text-blue-900">{message}</p>
        {hint && (
          <p className="text-sm text-blue-600 italic mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}
