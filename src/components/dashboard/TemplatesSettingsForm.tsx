"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateClinicianInfo,
  uploadClinicianSignature,
  updateLetterhead,
  uploadLetterheadLogo,
} from "@/app/(dashboard)/d/_actions/documents";

/* ── Types ────────────────────────────────────────────── */

interface ClinicianInfo {
  licenseNumber: string;
  npi: string;
  credentials: string;
  signatureUrl: string;
}

interface LetterheadInfo {
  logoUrl: string;
  disclaimer: string;
}

interface TemplateItem {
  key: string;
  displayName: string;
  description: string;
  category: string;
  requiresVerifiedOrg: boolean;
}

interface Props {
  clinician: ClinicianInfo;
  letterhead: LetterheadInfo;
  templates: TemplateItem[];
}

/* ── Category badge colors ───────────────────────────── */

const CATEGORY_STYLES: Record<string, string> = {
  letter: "bg-blue-100 text-blue-700",
  clinical_note: "bg-green-100 text-green-700",
  prior_auth: "bg-amber-100 text-amber-700",
  certificate: "bg-purple-100 text-purple-700",
  instructions: "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  letter: "Letter",
  clinical_note: "Clinical Note",
  prior_auth: "Prior Auth",
  certificate: "Certificate",
  instructions: "Instructions",
};

/* ── Component ────────────────────────────────────────── */

export default function TemplatesSettingsForm({
  clinician,
  letterhead,
  templates,
}: Props) {
  const router = useRouter();

  // Clinician fields
  const [licenseNumber, setLicenseNumber] = useState(clinician.licenseNumber);
  const [npi, setNpi] = useState(clinician.npi);
  const [credentials, setCredentials] = useState(clinician.credentials);
  const [signatureUrl, setSignatureUrl] = useState(clinician.signatureUrl);
  const [savingClinician, setSavingClinician] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const sigInputRef = useRef<HTMLInputElement>(null);

  // Letterhead fields
  const [logoUrl, setLogoUrl] = useState(letterhead.logoUrl);
  const [disclaimer, setDisclaimer] = useState(letterhead.disclaimer);
  const [savingLetterhead, setSavingLetterhead] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ── Clinician save ── */

  async function handleSaveClinician() {
    setSavingClinician(true);
    const result = await updateClinicianInfo({
      licenseNumber,
      npi,
      credentials,
    });
    setSavingClinician(false);

    if (result.success) {
      toast.success("Clinician information saved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
  }

  /* ── Signature upload ── */

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      toast.error("Only PNG files are accepted");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("File must be under 500KB");
      return;
    }

    setUploadingSig(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadClinicianSignature(fd);
    setUploadingSig(false);

    if (result.success && result.signatureUrl) {
      setSignatureUrl(result.signatureUrl);
      toast.success("Signature uploaded");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to upload");
    }

    // Reset input so the same file can be re-selected
    if (sigInputRef.current) sigInputRef.current.value = "";
  }

  /* ── Letterhead save ── */

  async function handleSaveLetterhead() {
    setSavingLetterhead(true);
    const result = await updateLetterhead({ disclaimer });
    setSavingLetterhead(false);

    if (result.success) {
      toast.success("Letterhead settings saved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
  }

  /* ── Letterhead logo upload ── */

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadLetterheadLogo(fd);
    setUploadingLogo(false);

    if (result.success && result.logoUrl) {
      setLogoUrl(result.logoUrl);
      toast.success("Letterhead logo uploaded");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to upload");
    }

    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  /* ── Clinician info changed check ── */

  const clinicianChanged =
    licenseNumber !== clinician.licenseNumber ||
    npi !== clinician.npi ||
    credentials !== clinician.credentials;

  const letterheadChanged = disclaimer !== letterhead.disclaimer;

  return (
    <div className="space-y-8">
      {/* ── Section 1: Clinician Information ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink mb-1">Clinician Information</h2>
        <p className="text-xs text-slate mb-5">
          These credentials appear on signed documents and clinical letters.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              License Number
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. CPSO 12345"
              maxLength={50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              NPI
            </label>
            <input
              type="text"
              value={npi}
              onChange={(e) => setNpi(e.target.value)}
              placeholder="e.g. 1234567890"
              maxLength={20}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Credentials
            </label>
            <input
              type="text"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g. MD, DO, NP"
              maxLength={30}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Signature Image
            </label>
            <p className="text-xs text-ash mb-2">PNG only, max 500KB. This appears on signed documents.</p>
            {signatureUrl && (
              <div className="mb-3 rounded-lg border border-gray-100 bg-snow p-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureUrl}
                  alt="Clinician signature"
                  className="h-12 w-auto"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={sigInputRef}
                type="file"
                accept="image/png"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              <button
                onClick={() => sigInputRef.current?.click()}
                disabled={uploadingSig}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {uploadingSig ? "Uploading..." : signatureUrl ? "Replace Signature" : "Upload Signature"}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveClinician}
              disabled={savingClinician || !clinicianChanged}
              className="rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-hilt-blue-dark transition-colors"
            >
              {savingClinician ? "Saving..." : "Save Clinician Info"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Letterhead ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink mb-1">Letterhead</h2>
        <p className="text-xs text-slate mb-5">
          Logo and disclaimer text for document headers and footers.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Letterhead Logo
            </label>
            <p className="text-xs text-ash mb-2">Image file, max 2MB. Displayed at the top of printed documents.</p>
            {logoUrl && (
              <div className="mb-3 rounded-lg border border-gray-100 bg-snow p-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Letterhead logo"
                  className="h-12 w-auto"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {uploadingLogo ? "Uploading..." : logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Disclaimer Text
            </label>
            <p className="text-xs text-ash mb-2">Appears in the footer of generated PDFs.</p>
            <textarea
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              placeholder="e.g. This document is for informational purposes only and does not constitute medical advice."
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue resize-none"
            />
            <p className="text-xs text-ash mt-1">{disclaimer.length}/500</p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveLetterhead}
              disabled={savingLetterhead || !letterheadChanged}
              className="rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-hilt-blue-dark transition-colors"
            >
              {savingLetterhead ? "Saving..." : "Save Letterhead"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Document Templates (read only) ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-ink">Document Templates</h2>
          <span className="text-xs text-ash">{templates.length} active</span>
        </div>
        <p className="text-xs text-slate mb-5">
          All available templates for your organization. Template customization coming soon.
        </p>

        {templates.length === 0 ? (
          <p className="text-sm text-ash py-4 text-center">No templates available.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.key}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-snow px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{t.displayName}</span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        CATEGORY_STYLES[t.category] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                    {t.requiresVerifiedOrg && (
                      <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        Verified only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate mt-0.5">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
