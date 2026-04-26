"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface CreditLogEntry {
  id: string;
  credits_amount: number;
  description: string;
  created_at: string;
}

export default function PaymentHistory({ orgId }: { orgId: string }) {
  const [entries, setEntries] = useState<CreditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("credits_log")
      .select("id, credits_amount, description, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [orgId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Credit History</h2>
        <div className="h-32 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">Credit History</h2>

      {entries.length === 0 ? (
        <p className="text-sm text-slate text-center py-8">
          No credit activity yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-3 font-medium text-slate whitespace-nowrap">Date</th>
                <th className="text-left py-2 pr-3 font-medium text-slate min-w-[200px]">
                  Description
                </th>
                <th className="text-right py-2 font-medium text-slate whitespace-nowrap">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-2 pr-3 text-slate whitespace-nowrap">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3 text-ink">{e.description}</td>
                  <td
                    className={`py-2 text-right font-medium whitespace-nowrap ${
                      e.credits_amount < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {e.credits_amount < 0
                      ? `${e.credits_amount}`
                      : `+${e.credits_amount}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
