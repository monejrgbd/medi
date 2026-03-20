"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPremiumCodes, createPremiumCode } from "@/app/(dashboard)/d/_actions/admin";
import { Copy, Check, Plus, RefreshCw, TicketCheck } from "lucide-react";

interface ApprovalCode {
  id: string;
  code: string;
  email: string | null;
  phone: string | null;
  domain: string | null;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  email_sent: boolean;
  used_by_org_id: string | null;
  used_by_org_name: string | null;
}

function StatusBadge({ code }: { code: ApprovalCode }) {
  if (code.used_at) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Used
      </span>
    );
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Available
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-2 rounded p-1 text-slate hover:bg-gray-100 hover:text-ink transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function AdminPremiumCodes() {
  const [codes, setCodes] = useState<ApprovalCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [domain, setDomain] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    const result = await fetchPremiumCodes();
    if (result.success && result.data) {
      setCodes(result.data as ApprovalCode[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const result = await createPremiumCode({
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      domain: domain.trim() || undefined,
      sendEmail,
    });

    if (result && typeof result === "object" && "success" in result) {
      if (result.success) {
        setEmail("");
        setPhone("");
        setDomain("");
        setSendEmail(false);
        setShowForm(false);
        await loadCodes();
      } else {
        setError((result as { error?: string }).error || "Failed to create code");
      }
    }
    setCreating(false);
  };

  // Quick create (no identifiers)
  const handleQuickCreate = async () => {
    setCreating(true);
    setError("");
    const result = await createPremiumCode({});
    if (result && typeof result === "object" && "success" in result) {
      if (result.success) {
        await loadCodes();
      } else {
        setError((result as { error?: string }).error || "Failed to create code");
      }
    }
    setCreating(false);
  };

  const totalCodes = codes.length;
  const usedCodes = codes.filter((c) => c.used_at).length;
  const availableCodes = codes.filter((c) => !c.used_at && (!c.expires_at || new Date(c.expires_at) >= new Date())).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Premium Codes</h1>
          <p className="text-sm text-slate mt-1">Create and manage premium trial approval codes</p>
        </div>
        <button
          onClick={loadCodes}
          disabled={loading}
          className="rounded-lg border border-gray-200 p-2 text-slate hover:bg-gray-50 hover:text-ink transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-slate">Total</p>
          <p className="text-2xl font-bold text-ink mt-1">{totalCodes}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-slate">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{availableCodes}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-slate">Used</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{usedCodes}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleQuickCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark transition-colors disabled:opacity-50"
        >
          <TicketCheck className="h-4 w-4" />
          {creating ? "Creating..." : "Quick Create"}
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create with Details
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Create Code with Identifiers</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinic@example.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Domain (optional)</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="clinicname.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-gray-300"
              />
              Send approval email
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Code"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Codes Table */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-slate">Code</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Domain</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Used By</th>
                <th className="px-4 py-3 text-left font-medium text-slate">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && codes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate">
                    Loading...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate">
                    No codes yet. Create one above.
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <code className="font-mono text-sm font-semibold text-ink tracking-wider">
                          {code.code}
                        </code>
                        <CopyButton text={code.code} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">{code.email || "—"}</td>
                    <td className="px-4 py-3 text-slate">{code.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate">{code.domain || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge code={code} />
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {code.used_by_org_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate whitespace-nowrap">
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
