"use client";

import { createContext, useContext } from "react";

interface RoleAssignment {
  role: string;
  location_id: string;
  location_name: string;
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_plan: string;
  credits_total: number;
  credits_used: number;
  trial_end_date: string;
  review_sms_addon: boolean;
  followup_sms_addon: boolean;
  created_at: string;
}

interface StaffUser {
  id: string;
  org_id: string;
  auth_uid: string;
  full_name: string;
  username: string;
}

interface RoleContextValue {
  org: OrgData;
  roles: RoleAssignment[];
  isOwner: boolean;
  currentStaffUser: StaffUser | null;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RoleContextValue;
}) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
