import { redirect } from "next/navigation";

export default async function ShortSummaryRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/summary/${token}`);
}
