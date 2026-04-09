import { requireAuth, getMyRoles, getMyOrg, getStaffUser } from "@/lib/auth";
import { RoleProvider } from "@/contexts/RoleContext";
import { Toaster } from "sonner";
import SubscriptionWarningBanner from "@/components/dashboard/SubscriptionWarningBanner";
import OnboardingBanner from "@/components/dashboard/OnboardingBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const [roles, org, staffUser] = await Promise.all([
    getMyRoles(),
    getMyOrg(),
    getStaffUser(user.id),
  ]);

  const isOwner = org?.owner_id === user.id;

  return (
    <RoleProvider
      value={{
        org,
        roles,
        isOwner,
        currentStaffUser: staffUser,
      }}
    >
      <SubscriptionWarningBanner />
      <OnboardingBanner />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Toaster position="top-right" richColors />
    </RoleProvider>
  );
}
