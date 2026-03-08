"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";
import { getMyOrg } from "@/lib/auth";

export async function createLocation(formData: {
  orgId: string;
  name: string;
  address?: string;
  specialty?: string;
  operatingHours?: Record<string, unknown>;
}) {
  const name = stripHtml(formData.name).slice(0, 100);
  if (!name) {
    return { success: false, error: "Location name is required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_location", {
    p_org_id: formData.orgId,
    p_name: name,
    p_address: formData.address ? stripHtml(formData.address).slice(0, 200) : null,
    p_specialty: formData.specialty || null,
    p_operating_hours: formData.operatingHours || null,
  });

  if (error) return { success: false, error: "Failed to create location" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true, locationId: data?.location_id };
}

export async function updateLocation(formData: {
  locationId: string;
  name?: string;
  address?: string;
  specialty?: string;
  operatingHours?: Record<string, unknown>;
  aiModel?: string;
  displayFormat?: string;
  referralEmail?: string;
  tabletCount?: number;
  timezone?: string;
  logoUrl?: string;
}) {
  const supabase = await createClient();

  const params: Record<string, unknown> = {
    p_location_id: formData.locationId,
  };

  if (formData.name !== undefined) {
    const name = stripHtml(formData.name).slice(0, 100);
    if (!name) return { success: false, error: "Location name cannot be empty" };
    params.p_name = name;
  }
  if (formData.address !== undefined) params.p_address = stripHtml(formData.address).slice(0, 200);
  if (formData.specialty !== undefined) params.p_specialty = formData.specialty;
  if (formData.operatingHours !== undefined) params.p_operating_hours = formData.operatingHours;
  if (formData.aiModel !== undefined) params.p_ai_model = formData.aiModel;
  if (formData.displayFormat !== undefined) params.p_display_format = formData.displayFormat;
  if (formData.referralEmail !== undefined) params.p_referral_email = stripHtml(formData.referralEmail).slice(0, 200);
  if (formData.tabletCount !== undefined) params.p_tablet_count = formData.tabletCount;
  if (formData.timezone !== undefined) params.p_timezone = formData.timezone;
  if (formData.logoUrl !== undefined) params.p_logo_url = formData.logoUrl;

  const { data, error } = await supabase.rpc("update_location", params);

  if (error) return { success: false, error: "Failed to update location" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function updateOrganization(formData: { name: string }) {
  const name = stripHtml(formData.name).slice(0, 100);
  if (!name) {
    return { success: false, error: "Organization name is required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_organization", {
    p_name: name,
  });

  if (error) return { success: false, error: "Failed to update organization" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function uploadLocationLogo(locationId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "File must be under 2MB" };
  }

  const org = await getMyOrg();
  if (!org?.id) return { success: false, error: "Organization not found" };

  const supabase = await createClient();
  const path = `${org.id}/${locationId}/logo`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: "Failed to upload logo" };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const { data, error } = await supabase.rpc("update_location", {
    p_location_id: locationId,
    p_logo_url: urlData.publicUrl,
  });

  if (error) return { success: false, error: "Failed to update location logo" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true, logoUrl: urlData.publicUrl };
}
