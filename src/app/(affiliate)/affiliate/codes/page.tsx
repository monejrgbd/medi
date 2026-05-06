import CodesPanel from "@/components/affiliate/CodesPanel";

export const dynamic = "force-dynamic";

export default function PartnerCodesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Codes</h1>
        <p className="mt-1 text-sm text-slate">
          Your affiliate code is multi use and lifetime. Premium trial codes are single use and target a specific clinic we email on your behalf.
        </p>
      </div>
      <CodesPanel />
    </div>
  );
}
