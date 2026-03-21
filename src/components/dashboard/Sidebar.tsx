"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import {
  LayoutDashboard,
  MapPin,
  Users,
  ClipboardList,
  Activity,
  Star,
  BarChart3,
  CreditCard,
  Tablet,
  Settings,
  Wrench,
  ArrowLeftRight,
  Megaphone,
  LogOut,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/d/owner", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/d/owner/locations", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
  { href: "/d/owner/staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
  { href: "/d/owner/audit", label: "Audit Trail", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/d/vitals-config", label: "Vitals", icon: <Activity className="h-4 w-4" /> },
  { href: "/d/reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
  { href: "/d/manager", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/d/owner/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/d/owner/marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
  { href: "/d/owner/kiosk", label: "Kiosk Setup", icon: <Tablet className="h-4 w-4" /> },
  { href: "/d/owner/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
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
        <Link
          href="/d/select-role"
          onClick={() => setMobileOpen(false)}
          className="mt-3 flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Switch Role
        </Link>
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
            {item.icon}
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
          <Wrench className="h-4 w-4" />
          Request Custom Build
        </a>
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 hover:text-ink transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  // Derive page title from pathname
  const activeItem = NAV_ITEMS.find((item) => isActive(item.href));
  const pageTitle = activeItem?.label || "Dashboard";

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-ink hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink truncate">{pageTitle}</span>
        <span className="ml-auto text-xs text-slate truncate">{org.name}</span>
      </div>

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
