import { requireAuth, getStaffUser, isOwner, getMyRoles, getMyOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewHub from "@/components/reviews/ReviewHub";

export default async function ReviewsPage() {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  const staffUser = await getStaffUser(user.id);
  const roles = await getMyRoles();
  const org = await getMyOrg();

  const orgId = staffUser?.org_id || (ownerCheck ? (org as { id?: string })?.id : null);
  if (!orgId) redirect("/d/select-role");

  let locations: { id: string; name: string }[] = [];

  if (ownerCheck) {
    const supabase = await createClient();
    const { data: locs } = await supabase
      .from("locations")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name");
    locations = (locs || []).map((l) => ({ id: l.id, name: l.name }));
  } else {
    const reviewRoles = roles.filter((r: { role: string }) => r.role === "reviews" || r.role === "manager");
    if (reviewRoles.length === 0) redirect("/d/select-role");

    const locationMap = new Map<string, string>();
    for (const r of reviewRoles) {
      locationMap.set(r.location_id, r.location_name);
    }
    locations = Array.from(locationMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }

  const isManager = ownerCheck || roles.some((r: { role: string }) => r.role === "manager");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            View patient feedback and manage review platforms
          </p>
        </div>
        <ReviewHub
          locations={locations}
          isOwnerOrManager={isManager}
        />
      </div>
    </div>
  );
}
