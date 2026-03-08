import { createClient } from "@/lib/supabase/server";
import LocationsPage from "./LocationsPage";

export const metadata = {
  title: "Locations — Hilt Health",
};

export default async function OwnerLocationsPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase.rpc("get_locations");

  return <LocationsPage locations={locations || []} />;
}
