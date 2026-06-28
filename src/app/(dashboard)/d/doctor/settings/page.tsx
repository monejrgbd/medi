import VoiceEnrollment from "@/components/doctor/VoiceEnrollment";

export const metadata = { title: "Voice settings" };

export default function DoctorSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 mb-6 text-sm text-slate">Your AI scribe voice ID.</p>
      <VoiceEnrollment />
    </div>
  );
}
