import { createClient } from "@/lib/supabase/server";
import { getMyOrg } from "@/lib/auth";
import TemplatesSettingsForm from "@/components/dashboard/TemplatesSettingsForm";

export const metadata = {
  title: "Document Templates — Hilt Health",
};

export default async function TemplatesPage() {
  const org = await getMyOrg();
  const supabase = await createClient();

  const [{ data: orgRow }, { data: templates }] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, clinician_license_number, clinician_npi, clinician_credentials, clinician_signature_url, letterhead_logo_url, letterhead_disclaimer"
      )
      .eq("id", org.id)
      .single(),
    supabase
      .from("document_templates")
      .select("key, display_name, description, document_category, requires_verified_org, active")
      .eq("active", true)
      .order("display_name"),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Document Templates</h1>
        <p className="mt-1 text-sm text-slate">
          Manage clinician credentials, letterhead, and view available document templates.
        </p>
      </div>

      <TemplatesSettingsForm
        clinician={{
          licenseNumber: orgRow?.clinician_license_number ?? "",
          npi: orgRow?.clinician_npi ?? "",
          credentials: orgRow?.clinician_credentials ?? "",
          signatureUrl: orgRow?.clinician_signature_url ?? "",
        }}
        letterhead={{
          logoUrl: orgRow?.letterhead_logo_url ?? "",
          disclaimer: orgRow?.letterhead_disclaimer ?? "",
        }}
        templates={
          (templates ?? []).map((t) => ({
            key: t.key,
            displayName: t.display_name,
            description: t.description,
            category: t.document_category,
            requiresVerifiedOrg: t.requires_verified_org,
          }))
        }
      />
    </div>
  );
}
