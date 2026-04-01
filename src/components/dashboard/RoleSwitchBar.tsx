"use client";

import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import {
  Stethoscope,
  ClipboardList,
  Settings,
  HeartPulse,
  Building2,
  Star,
  Megaphone,
} from "lucide-react";
import type { ReactNode } from "react";

const ROLE_NAV: Record<string, { label: string; icon: ReactNode; path: string }> = {
  owner:        { label: "Owner",        icon: <Building2 className="h-3.5 w-3.5" />,    path: "/d/owner" },
  doctor:       { label: "Doctor",       icon: <Stethoscope className="h-3.5 w-3.5" />,  path: "/d/doctor" },
  nurse:        { label: "Nurse",        icon: <HeartPulse className="h-3.5 w-3.5" />,   path: "/d/nurse" },
  receptionist: { label: "Receptionist", icon: <ClipboardList className="h-3.5 w-3.5" />, path: "/d/receptionist" },
  manager:      { label: "Manager",      icon: <Settings className="h-3.5 w-3.5" />,     path: "/d/manager" },
  reviews:      { label: "Reviews",      icon: <Star className="h-3.5 w-3.5" />,         path: "/d/reviews" },
  marketer:     { label: "Marketing",    icon: <Megaphone className="h-3.5 w-3.5" />,    path: "/d/marketer" },
};

export default function RoleSwitchBar({ currentRole }: { currentRole: string }) {
  const { roles, isOwner } = useRole();
  const router = useRouter();

  // Build unique role list
  const uniqueRoles = [...new Set(roles.map((r) => r.role))];
  const allTabs: string[] = [];
  if (isOwner) allTabs.push("owner");
  uniqueRoles.forEach((r) => {
    if (!allTabs.includes(r)) allTabs.push(r);
  });

  // Only render if more than one tab available
  if (allTabs.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-white px-4 py-2">
      {allTabs.map((role) => {
        const nav = ROLE_NAV[role];
        if (!nav) return null;
        const active = role === currentRole;
        return (
          <button
            key={role}
            onClick={() => router.push(nav.path)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-hilt-blue text-white"
                : "text-slate hover:bg-gray-100"
            }`}
          >
            {nav.icon}
            {nav.label}
          </button>
        );
      })}
    </div>
  );
}
