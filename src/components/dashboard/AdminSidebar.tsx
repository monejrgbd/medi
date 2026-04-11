"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TicketCheck, Building2, Cpu, LogOut } from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/d/admin", label: "Premium Codes", icon: <TicketCheck className="h-4 w-4" /> },
  { href: "/d/admin/enterprise", label: "Enterprise", icon: <Building2 className="h-4 w-4" /> },
  { href: "/d/admin/ai-config", label: "AI Config", icon: <Cpu className="h-4 w-4" /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/d/admin") return pathname === "/d/admin";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-semibold text-ink">Hilt Health</h2>
        <p className="text-xs text-slate mt-0.5">Platform Admin</p>
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

      <div className="p-4 border-t border-gray-100">
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

  const activeItem = NAV_ITEMS.find((item) => isActive(item.href));
  const pageTitle = activeItem?.label || "Admin";

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
        <span className="ml-auto text-xs text-slate">Admin</span>
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
