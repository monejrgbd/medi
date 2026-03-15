import { createClient } from "@/lib/supabase/server";
import { getMyOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffTable from "@/components/dashboard/StaffTable";

export const metadata = {
  title: "Staff — Hilt Health",
};

export default async function OwnerStaffPage() {
  const supabase = await createClient();
  const org = await getMyOrg();

  if (!org?.id) redirect("/d/owner");

  const [{ data: staffList }, { data: locations }] = await Promise.all([
    supabase.rpc("get_staff_list", { p_org_id: org.id }),
    supabase.rpc("get_locations"),
  ]);

  const locationOptions = (locations || []).map(
    (l: { id: string; name: string }) => ({
      id: l.id,
      name: l.name,
    })
  );

  return (
    <div>
      <StaffTable staff={staffList || []} locations={locationOptions} />
    </div>
  );
}
