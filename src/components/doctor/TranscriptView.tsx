"use client";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface TranscriptViewProps {
  messages: Message[];
}

export default function TranscriptView({ messages }: TranscriptViewProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No transcript available.
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {messages.map((msg) => {
        const isPatient = msg.role === "patient";
        const isAI = msg.role === "ai";

        return (
          <div
            key={msg.id}
            className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                isPatient
                  ? "bg-hilt-blue text-white"
                  : isAI
                    ? "bg-gray-100 text-ink"
                    : "bg-gray-50 text-slate text-center text-xs mx-auto"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-[10px] mt-1 ${
                  isPatient ? "text-white/60" : "text-slate"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
