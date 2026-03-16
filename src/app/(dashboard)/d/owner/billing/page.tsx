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

interface LocationWithAddons {
  id: string;
  name: string;
  review_sms_enabled: boolean;
  followup_sms_enabled: boolean;
}

export default function BillingPage() {
  const { org, isOwner } = useRole();
  const [dashData, setDashData] = useState<Record<string, unknown> | null>(null);
  const [locations, setLocations] = useState<LocationWithAddons[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    const result = await fetchCreditDashboard();
    if (result?.success) {
      setDashData(result as Record<string, unknown>);
    }
  }, []);

  const loadLocations = useCallback(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.rpc("get_locations").then(({ data }) => {
        if (data) {
          setLocations(
            data.map((l: LocationWithAddons) => ({
              id: l.id,
              name: l.name,
              review_sms_enabled: l.review_sms_enabled ?? false,
              followup_sms_enabled: l.followup_sms_enabled ?? false,
            }))
          );
        }
      });
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations, refreshKey]);

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

  const hasFollowupSms = locations.some((l) => l.followup_sms_enabled);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <CreditDashboard key={refreshKey} />

      <SubscriptionManager
        currentPlan={org.subscription_plan}
        orgId={org.id}
        onPlanChanged={handleRefresh}
      />

      <AddOnToggles
        locations={locations}
        subscriptionPlan={org.subscription_plan}
        onChanged={handleRefresh}
      />

      {hasFollowupSms && (
        <FollowUpSmsConfig orgId={org.id} />
      )}

      <OveragePurchase
        onPurchased={handleRefresh}
        subscriptionPlan={org.subscription_plan}
        billingCycleStart={dashData?.billing_cycle_start as string | null ?? null}
      />

      <PaymentHistory orgId={org.id} />

      <CancelSubscription
        orgId={org.id}
        currentPlan={org.subscription_plan}
        cancelAtPeriodEnd={dashData?.cancel_at_period_end as string | null ?? null}
        onCancelled={handleRefresh}
      />
    </div>
  );
}
