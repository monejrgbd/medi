"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";

const NAV_ITEMS = [
  { href: "/d/owner", label: "Overview", icon: "📊" },
  { href: "/d/owner/locations", label: "Locations", icon: "📍" },
  { href: "/d/owner/staff", label: "Staff", icon: "👥" },
  { href: "/d/owner/audit", label: "Audit Trail", icon: "📋" },
  { href: "/d/reviews", label: "Reviews", icon: "⭐" },
  { href: "/d/manager", label: "Analytics", icon: "📈" },
  { href: "/d/owner/billing", label: "Billing", icon: "💳" },
  { href: "/d/owner/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { org } = useRole();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/d/owner") return pathname === "/d/owner";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-semibold text-ink truncate">{org.name}</h2>
        <p className="text-xs text-slate mt-0.5">Owner Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-blue-50 text-hilt-blue"
                : "text-slate hover:bg-gray-50 hover:text-ink"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-1">
        <a
          href="mailto:support@hilthealth.com?subject=Custom%20Build%20Request"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 hover:text-ink transition-colors"
        >
          <span>🛠️</span>
          Request Custom Build
        </a>
        <Link
          href="/d/select-role"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 hover:text-ink transition-colors"
        >
          <span>🔄</span>
          Switch Role
        </Link>
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 hover:text-ink transition-colors"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-lg bg-white p-2 shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate hover:text-ink"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-100 bg-white min-h-screen">
        {navContent}
      </aside>
    </>
  );
}
