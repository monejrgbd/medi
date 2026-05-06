export default function SummaryMockup() {
  return (
    <div className="w-[300px] sm:w-[360px] rounded-2xl border border-green-200 bg-green-50 p-5 shadow-xl ring-1 ring-green-900/5">
      <p className="text-[10px] font-semibold text-green-700 mb-2">Patient approves summary the doctor will read</p>
      <p className="text-sm leading-relaxed text-green-900 mb-3">
        Returning patient with worsening knee pain, new morning stiffness in hands lasting about 1 hour, and knuckle swelling. Ibuprofen provides partial relief. Fatigue reported. Family history of rheumatoid arthritis.
      </p>
      <div className="rounded-lg bg-white/60 p-2.5 mb-3">
        <p className="text-[9px] font-semibold text-green-800 mb-1.5">Your information on file</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
          <div>
            <p className="font-medium text-slate">Meds (1)</p>
            <p className="text-ink">Ibuprofen PRN</p>
          </div>
          <div>
            <p className="font-medium text-red-600">Allergies (1)</p>
            <p className="text-ink">Penicillin</p>
          </div>
          <div>
            <p className="font-medium text-slate">Chronic (0)</p>
            <p className="text-ash">None</p>
          </div>
          <div>
            <p className="font-medium text-slate">Pets (1)</p>
            <p className="text-ink">Cat</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg border border-green-300 bg-white py-2 text-center text-[10px] font-medium text-green-700">
          Something is not right
        </div>
        <div className="flex-1 rounded-lg bg-green-600 py-2 text-center text-[10px] font-semibold text-white">
          This is accurate ✓
        </div>
      </div>
      <p className="mt-2 text-[9px] text-right text-ash">9:09 AM</p>
    </div>
  );
}
