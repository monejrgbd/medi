import { requireAuth, getMyRoles, getMyOrg, getStaffUser } from "@/lib/auth";
import { RoleProvider } from "@/contexts/RoleContext";

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
      {children}
    </RoleProvider>
  );
}
