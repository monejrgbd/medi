"use client";

import { useEffect, useRef } from "react";

interface NotificationBannerProps {
  patientName: string;
  onDismiss: () => void;
}

export default function NotificationBanner({
  patientName,
  onDismiss,
}: NotificationBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={onDismiss}
      className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-3 cursor-pointer lg:mx-6"
    >
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
      <p className="text-sm font-medium text-red-800">
        HIGH URGENCY — {patientName}
      </p>
    </div>
  );
}
