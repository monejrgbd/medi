"use client";

import { useState, useEffect } from "react";

export default function NotificationPermission() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("hilt_notif_dismissed") === "true") return;
    setShow(true);
  }, []);

  if (!show) return null;

  async function handleEnable() {
    const result = await Notification.requestPermission();
    if (result !== "default") setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem("hilt_notif_dismissed", "true");
    setShow(false);
  }

  return (
    <div className="mx-4 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center justify-between lg:mx-6">
      <p className="text-sm text-blue-800">
        Enable notifications to get alerts for new patients.
      </p>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <button
          onClick={handleEnable}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
