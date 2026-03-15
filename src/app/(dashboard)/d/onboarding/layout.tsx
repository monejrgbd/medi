import { requireAuth, isOwner } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);

  if (!ownerCheck) {
    redirect("/d/select-role");
  }

  return (
    <div className="min-h-screen bg-snow">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-hilt-blue">Hilt Health</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
