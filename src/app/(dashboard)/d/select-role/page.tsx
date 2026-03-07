import RoleSelector from "@/components/RoleSelector";

export const metadata = {
  title: "Select Role — Hilt Health",
};

export default function SelectRolePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-2xl">
        <RoleSelector />
      </div>
    </div>
  );
}
