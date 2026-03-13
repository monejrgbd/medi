"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
        <div className="flex space-x-1.5 rtl:space-x-reverse">
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
