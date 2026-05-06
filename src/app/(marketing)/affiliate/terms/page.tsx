import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AffiliateTermsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_tos_versions")
    .select("version, body_md, published_at")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-slate">No terms published yet.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-wider text-slate">Version {data.version}</p>
      <article className="prose prose-slate mt-2 max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {data.body_md}
      </article>
    </main>
  );
}
