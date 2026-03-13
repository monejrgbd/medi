"use client";

interface ChatMessageProps {
  role: "patient" | "ai" | "system";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center my-3">
        <div className="rounded-lg bg-blue-50 px-4 py-3 max-w-sm text-center">
          <p className="text-sm text-slate">{content}</p>
        </div>
      </div>
    );
  }

  const isPatient = role === "patient";

  return (
    <div className={`flex ${isPatient ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
          isPatient
            ? "bg-hilt-blue text-white rounded-br-md"
            : "bg-gray-100 text-ink rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}
