"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/affiliate/dashboard", label: "Dashboard" },
  { href: "/affiliate/codes", label: "Codes" },
  { href: "/affiliate/referrals", label: "Referrals" },
  { href: "/affiliate/earnings", label: "Earnings" },
  { href: "/affiliate/profile", label: "Profile" },
];

export default function PartnerShell({
  partner,
  children,
}: {
  partner: { display_name: string; status: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <Link href="/affiliate/dashboard" className="text-xl font-bold text-hilt-blue tracking-tight">
            Hilt Affiliate
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate sm:inline">{partner.display_name}</span>
            {partner.status !== "active" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 capitalize">
                {partner.status}
              </span>
            )}
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="text-xs text-slate hover:text-ink hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-[1100px] px-6">
          <div className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "border-hilt-blue text-ink"
                    : "border-transparent text-slate hover:text-ink"
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-[1100px] px-6 py-8">{children}</main>
    </div>
  );
}
