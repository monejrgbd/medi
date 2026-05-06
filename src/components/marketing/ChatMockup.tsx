import React from "react";

export default function ChatMockup() {
  const chatMessages = [
    { role: "ai", text: "Hi Sarah, welcome back to Riverside Family Medicine! What brings you in today?", time: "9:03 AM", delay: "0.5s" },
    { role: "patient", text: "My hands have been really stiff every morning and my knuckles are swollen", time: "9:04 AM", delay: "1.8s" },
    { role: "ai", text: "You came in for knee pain on March 1. Could the hand stiffness be related?", time: "9:05 AM", delay: "3.2s" },
    { role: "patient", text: "Actually yes, my knee has been worse too", time: "9:06 AM", delay: "4.6s" },
  ];

  return (
    <div className="space-y-3">
      {/* QR scan step */}
      <div className="w-[300px] sm:w-[340px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-gray-900/5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Patient scans QR code or opens a shared link</p>
          <p className="text-[11px] text-slate">Their phone or your clinic tablet, no app needed</p>
        </div>
      </div>

      {/* Arrow: QR → chat */}
      <div className="flex justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-900/5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </div>

      {/* Chat card */}
      <div className="w-[300px] sm:w-[340px] rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-900/5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-hilt-blue">
              <span className="text-[10px] font-bold text-white">H</span>
            </div>
            <span className="text-xs font-semibold text-ink">Riverside Family Medicine</span>
          </div>
          <button className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-slate">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            English
          </button>
        </div>

        <div className="space-y-2.5 px-4 py-4">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`hero-msg ${m.role === "patient" ? "ml-6" : ""}`}
              style={{ "--delay": m.delay } as React.CSSProperties}
            >
              <div className={`rounded-xl px-3 py-2.5 ${m.role === "patient" ? "bg-hilt-blue/10" : "bg-snow"}`}>
                <p className={`text-sm leading-relaxed ${m.role === "patient" ? "text-ink" : "text-slate"}`}>
                  {m.text}
                </p>
              </div>
              <p className={`mt-0.5 text-[9px] text-ash ${m.role === "patient" ? "text-right" : ""}`}>{m.time}</p>
            </div>
          ))}
          <div
            className="hero-msg flex items-center gap-2 pt-1"
            style={{ "--delay": "6s" } as React.CSSProperties}
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-hilt-blue" />
            <span className="text-[11px] text-ash">Hilt Health is typing...</span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t border-gray-100 bg-white px-2 py-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
            <p className="text-[10px] text-ash">Send a message</p>
          </div>
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div className="flex h-[26px] shrink-0 items-center justify-center rounded-lg bg-hilt-blue px-2.5">
            <span className="text-[10px] font-medium text-white">Send</span>
          </div>
        </div>
      </div>

    </div>
  );
}
