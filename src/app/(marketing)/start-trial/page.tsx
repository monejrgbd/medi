import { redirect } from "next/navigation";

export const metadata = {
  title: "Start Your Free Trial — Hilt Health",
  description: "Create your Hilt Health account and start your free trial.",
};

// Passthrough to signup. Forwards the query string (email, code, ref, ...)
// so the captured email prefills the signup form instead of being dropped.
export default async function StartTrialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string" && value) qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const query = qs.toString();
  redirect(query ? `/signup?${query}` : "/signup");
}
