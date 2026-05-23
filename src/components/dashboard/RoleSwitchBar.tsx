"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleSafe } from "@/contexts/RoleContext";
import {
  Stethoscope,
  ClipboardList,
  Settings,
  HeartPulse,
  Building2,
  Star,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

interface TabDef {
  role: string;
  label: string;
  icon: LucideIcon;
  path: string;
  accent: string;
  bg: string;
}

const TABS: TabDef[] = [
  { role: "owner",        label: "Owner",        icon: Building2,     path: "/d/owner",        accent: "text-indigo-600 border-indigo-500", bg: "bg-indigo-50" },
  { role: "receptionist", label: "Receptionist", icon: ClipboardList, path: "/d/receptionist", accent: "text-green-600 border-green-500",   bg: "bg-green-50" },
  { role: "nurse",        label: "Nurse",        icon: HeartPulse,    path: "/d/nurse",        accent: "text-teal-600 border-teal-500",     bg: "bg-teal-50" },
  { role: "doctor",       label: "Doctor",       icon: Stethoscope,   path: "/d/doctor",       accent: "text-blue-600 border-blue-500",     bg: "bg-blue-50" },
  { role: "manager",      label: "Manager",      icon: Settings,      path: "/d/manager",      accent: "text-purple-600 border-purple-500", bg: "bg-purple-50" },
  { role: "reviews",      label: "Reviews",      icon: Star,          path: "/d/reviews",      accent: "text-yellow-600 border-yellow-500", bg: "bg-yellow-50" },
  { role: "marketer",     label: "Marketing",    icon: Megaphone,     path: "/d/marketer",     accent: "text-amber-600 border-amber-500",   bg: "bg-amber-50" },
];

const HIDDEN_PREFIXES = ["/d/select-role", "/d/onboarding", "/d/admin"];

export default function RoleSwitchBar() {
  const ctx = useRoleSafe();
  const pathname = usePathname();

  if (!ctx) return null;
  if (!pathname) return null;
  if (!pathname.startsWith("/d/")) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const { roles, isOwner } = ctx;
  const userRoles = new Set(roles.map((r) => r.role));

  const visibleTabs = TABS.filter((t) =>
    isOwner ? true : t.role !== "owner" && userRoles.has(t.role)
  );

  if (visibleTabs.length <= 1) return null;

  return (
    <div className="flex border-b border-gray-200 bg-white">
      {visibleTabs.map(({ role, label, icon: Icon, path, accent, bg }) => {
        const isActive = pathname === path || pathname.startsWith(path + "/");
        return (
          <Link
            key={role}
            href={path}
            className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 sm:py-3 text-[10px] sm:text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? `${accent} ${bg} border-current`
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="leading-tight">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
