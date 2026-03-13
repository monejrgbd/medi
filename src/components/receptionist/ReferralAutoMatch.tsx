"use client";

interface ReferralAutoMatchProps {
  referralMatch: {
    referral_id: string;
    specialty: string;
    from_org_name: string;
    from_doctor_name: string;
  };
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function ReferralAutoMatch({
  referralMatch,
  onConfirm,
  onDismiss,
}: ReferralAutoMatchProps) {
  return (
    <div className="rounded-lg border-2 border-hilt-blue bg-blue-50 p-3 mb-3">
      <p className="text-xs font-medium text-blue-900 mb-2">
        Referral from {referralMatch.from_org_name} ({referralMatch.specialty}){" "}
        — Dr. {referralMatch.from_doctor_name}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          Link &amp; Approve
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Approve Without Linking
        </button>
      </div>
    </div>
  );
}
