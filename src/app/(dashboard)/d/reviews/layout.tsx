import { requireAuth } from "@/lib/auth";

export default async function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
