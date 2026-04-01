"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/contexts/RoleContext";
import { fetchCreditDashboard } from "@/app/(dashboard)/d/_actions/billing";
import CreditDashboard from "@/components/billing/CreditDashboard";
import SubscriptionManager from "@/components/billing/SubscriptionManager";
import OveragePurchase from "@/components/billing/OveragePurchase";
import RechargeConfig from "@/components/billing/RechargeConfig";
import PaymentHistory from "@/components/billing/PaymentHistory";
import CancelSubscription from "@/components/billing/CancelSubscription";

export default function BillingPage() {
  const { org, isOwner } = useRole();
  const [dashData, setDashData] = useState<Record<string, unknown> | null>(null);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <CreditDashboard key={refreshKey} />

      <RechargeConfig
        rechargeLimit={dashData?.recharge_limit as number | null ?? null}
        rechargeUsed={(dashData?.recharge_used as number) ?? 0}
        subscriptionPlan={org.subscription_plan}
        onChanged={handleRefresh}
      />

      <SubscriptionManager
        currentPlan={org.subscription_plan}
        orgId={org.id}
        onPlanChanged={handleRefresh}
      />

      <OveragePurchase
        onPurchased={handleRefresh}
        subscriptionPlan={org.subscription_plan}
        billingCycleStart={dashData?.billing_cycle_start as string | null ?? null}
      />

      <PaymentHistory orgId={org.id} />

      {['starter', 'professional', 'business', 'enterprise'].includes(org.subscription_plan) && (
        <CancelSubscription
          orgId={org.id}
          currentPlan={org.subscription_plan}
          cancelAtPeriodEnd={dashData?.cancel_at_period_end as string | null ?? null}
          onCancelled={handleRefresh}
        />
      )}
    </div>
  );
}
