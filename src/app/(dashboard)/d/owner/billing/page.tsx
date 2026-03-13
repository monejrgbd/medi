"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/contexts/RoleContext";
import { fetchCreditDashboard } from "@/app/(dashboard)/d/_actions/billing";
import CreditDashboard from "@/components/billing/CreditDashboard";
import SubscriptionManager from "@/components/billing/SubscriptionManager";
import AddOnToggles from "@/components/billing/AddOnToggles";
import OveragePurchase from "@/components/billing/OveragePurchase";
import PaymentHistory from "@/components/billing/PaymentHistory";
import CancelSubscription from "@/components/billing/CancelSubscription";
import FollowUpSmsConfig from "@/components/billing/FollowUpSmsConfig";

export default function BillingPage() {
  const { org, isOwner } = useRole();
  const [dashData, setDashData] = useState<Record<string, unknown> | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    const result = await fetchCreditDashboard();
    if (result?.success) {
      setDashData(result as Record<string, unknown>);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    // Load locations for follow-up SMS config
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.rpc("get_locations").then(({ data }) => {
        if (data) {
          setLocations(
            data.map((l: { id: string; name: string }) => ({
              id: l.id,
              name: l.name,
            }))
          );
        }
      });
    });
  }, []);

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate">
          Only the organization owner can access billing.
        </p>
      </div>
    );
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-ink">Billing & Credits</h1>

      <CreditDashboard key={refreshKey} />

      <SubscriptionManager
        currentPlan={org.subscription_plan}
        orgId={org.id}
        onPlanChanged={handleRefresh}
      />

      <AddOnToggles
        reviewSmsAddon={org.review_sms_addon}
        followupSmsAddon={org.followup_sms_addon}
        locationCount={locations.length || 1}
        subscriptionPlan={org.subscription_plan}
        onChanged={handleRefresh}
      />

      {org.followup_sms_addon && (
        <FollowUpSmsConfig orgId={org.id} />
      )}

      <OveragePurchase onPurchased={handleRefresh} />

      <PaymentHistory orgId={org.id} />

      <CancelSubscription
        orgId={org.id}
        currentPlan={org.subscription_plan}
        onCancelled={handleRefresh}
      />
    </div>
  );
}
