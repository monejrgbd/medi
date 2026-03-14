"use client";

import { useState, useEffect, useRef } from "react";

interface KioskAutoResetProps {
  onReset: () => void;
  children: React.ReactNode;
  seconds?: number;
}

export default function KioskAutoReset({
  onReset,
  children,
  seconds = 10,
}: KioskAutoResetProps) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onResetRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progress = secondsLeft / seconds;

  return (
    <div className="relative w-full">
      {children}
      <div className="mt-6 text-center">
        <p className="text-xs text-ash mb-2">
          Resetting in {secondsLeft}s...
        </p>
        <div className="mx-auto max-w-xs h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-hilt-blue rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
