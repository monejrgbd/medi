import { requireAuth } from "@/lib/auth";
import PatientSearch from "@/components/dashboard/PatientSearch";

export const metadata = {
  title: "Patients — Hilt Health",
};

export default async function PatientsPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Find a patient</h1>
        <p className="text-sm text-slate mt-1">
          Search by name to open a patient&apos;s full profile, visit history, notes, and contact info.
          If two patients share the same name, narrow the results by entering a birthday.
        </p>
      </div>

      <PatientSearch />
    </div>
  );
}
