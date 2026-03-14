"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface KioskIdleTimeoutProps {
  onReset: () => void;
  active: boolean;
  idleMs?: number;
  countdownSeconds?: number;
}

export default function KioskIdleTimeout({
  onReset,
  active,
  idleMs = 120_000,
  countdownSeconds = 30,
}: KioskIdleTimeoutProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearTimers();
    setShowOverlay(false);
    setSecondsLeft(countdownSeconds);

    if (!active) return;

    idleTimerRef.current = setTimeout(() => {
      setShowOverlay(true);
      setSecondsLeft(countdownSeconds);
    }, idleMs);
  }, [active, idleMs, countdownSeconds, clearTimers]);

  // Start/stop idle detection when active changes
  useEffect(() => {
    if (!active) {
      clearTimers();
      setShowOverlay(false);
      setSecondsLeft(countdownSeconds);
      return;
    }

    resetIdleTimer();

    const events = ["click", "touchstart", "keypress"] as const;
    const handler = () => {
      resetIdleTimer();
    };

    events.forEach((e) => document.addEventListener(e, handler, true));

    return () => {
      clearTimers();
      events.forEach((e) => document.removeEventListener(e, handler, true));
    };
  }, [active, resetIdleTimer, clearTimers, countdownSeconds]);

  // Countdown when overlay is showing
  useEffect(() => {
    if (!showOverlay) return;

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onResetRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [showOverlay]);

  if (!showOverlay) return null;

  const progress = secondsLeft / countdownSeconds;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl">
        {/* Countdown circle */}
        <div className="relative mx-auto mb-6 h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-ink">{secondsLeft}</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-ink mb-2">
          Are you still here?
        </h2>
        <p className="text-sm text-slate">
          Tap anywhere to continue your session
        </p>

        <p className="mt-4 text-xs text-ash">
          Session will reset in {secondsLeft}s
        </p>
      </div>
    </div>
  );
}
