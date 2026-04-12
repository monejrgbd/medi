import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { createHash } from "crypto";
import type { Metadata } from "next";
import { isBot } from "@/lib/botDetection";

async function signPdfUrl(path: string): Promise<string | null> {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await service.storage
    .from("clinical-documents")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pin?: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getDocument(
  token: string,
  pin?: string | null
): Promise<Record<string, unknown> | null> {
  if (!UUID_RE.test(token)) return null;

  const headerStore = await headers();
  const rawIp =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ipHash = rawIp
    ? createHash("sha256").update(rawIp).digest("hex")
    : null;
  const userAgent = headerStore.get("user-agent") ?? null;

  // SMS link preview bots (iMessage, WhatsApp, Slack, etc.) auto-fetch URLs.
  // Return a minimal preview without burning the token's rate limit or access log.
  if (isBot(userAgent)) {
    return {
      reason: "bot_preview",
      template_display_name: "Clinical Document",
      clinic_name: "Hilt Health",
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase.rpc("get_document_public", {
    p_token: token,
    p_pin: pin ?? null,
    p_ip_hash: ipHash,
    p_user_agent: userAgent,
  });

  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const { pin } = await searchParams;
  const doc = await getDocument(token, pin);

  if (!doc || doc.reason !== "success") {
    return {
      title: "Clinical Document",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${doc.template_display_name} - ${doc.clinic_name}`,
    robots: { index: false, follow: false },
  };
}

/* ---------- PIN form (DOB entry) ---------- */
function PinForm({
  token,
  clinicName,
  clinicLogoUrl,
  errorMessage,
}: {
  token: string;
  clinicName?: string;
  clinicLogoUrl?: string;
  errorMessage?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {/* Clinic branding */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {clinicLogoUrl && (
              <img
                src={clinicLogoUrl}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            {clinicName && (
              <span className="text-lg font-semibold text-gray-900">
                {clinicName}
              </span>
            )}
          </div>

          <h1 className="text-center text-lg font-semibold text-gray-900 mb-1">
            Verify Your Identity
          </h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Enter your date of birth to access this document.
          </p>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form action={`/doc/${token}`} method="GET">
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="month"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Month
                </label>
                <input
                  id="month"
                  name="month"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="day"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Day
                </label>
                <input
                  id="day"
                  name="day"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DD"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {/* Combine month+day into pin query param via hidden input + JS */}
            </div>
            <noscript>
              <p className="text-xs text-gray-500 mb-3">
                JavaScript is required for this form. Please enable it and
                refresh the page.
              </p>
            </noscript>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue
            </button>

            {/* Client-side redirect with pin= query param */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  document.querySelector('form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    var m = document.getElementById('month').value.padStart(2, '0');
                    var d = document.getElementById('day').value.padStart(2, '0');
                    window.location.href = '/doc/${token}?pin=' + m + d;
                  });
                `,
              }}
            />
          </form>
        </div>

        <div className="text-center py-6">
          <a
            href="https://hilthealth.com"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by Hilt Health
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Error state ---------- */
function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */
export default async function DocumentPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { pin } = await searchParams;
  const doc = await getDocument(token, pin);

  // Null response = invalid token or RPC error
  if (!doc) {
    return (
      <ErrorState
        title="This link is not valid."
        description="The document you are looking for could not be found."
      />
    );
  }

  const reason = doc.reason as string;

  // Handle non-success reasons
  if (reason === "not_found") {
    return (
      <ErrorState
        title="This link is not valid."
        description="The document you are looking for could not be found."
      />
    );
  }

  if (reason === "expired") {
    return (
      <ErrorState
        title="This link has expired."
        description="This document link has expired. Contact the clinic for a new link."
      />
    );
  }

  if (reason === "revoked") {
    return (
      <ErrorState
        title="Document Revoked"
        description="This document has been revoked by the issuer. Contact the clinic if you have questions."
      />
    );
  }

  if (reason === "rate_limited") {
    return (
      <ErrorState
        title="Too Many Requests"
        description="Too many requests. Please try again later."
      />
    );
  }

  if (reason === "pin_required") {
    return (
      <PinForm
        token={token}
        clinicName={doc.clinic_name as string | undefined}
        clinicLogoUrl={doc.clinic_logo_url as string | undefined}
      />
    );
  }

  if (reason === "pin_wrong") {
    return (
      <PinForm
        token={token}
        clinicName={doc.clinic_name as string | undefined}
        clinicLogoUrl={doc.clinic_logo_url as string | undefined}
        errorMessage="Date of birth does not match. Please try again."
      />
    );
  }

  // Bot link-preview: return a minimal placeholder page so SMS/messaging apps
  // can show a card without hitting the rate limit or fetching sensitive data.
  if (reason === "bot_preview") {
    return (
      <ErrorState
        title="Clinical Document"
        description="Open this link on your phone to view and download the document from your clinic."
      />
    );
  }

  // Success: render the document
  const clinicName = doc.clinic_name as string;
  const clinicLogoUrl = doc.clinic_logo_url as string | undefined;
  const doctorName = doc.doctor_name as string | undefined;
  const templateName = doc.template_display_name as string;
  const body = doc.body as string;
  const pdfPath = doc.pdf_url as string | undefined;
  // The bucket is private. Generate a short lived signed URL so the anonymous
  // patient can download the PDF. Path is the storage object path returned by
  // get_document_public (e.g. "{org_id}/{document_type}/{document_id}.pdf").
  const pdfUrl = pdfPath ? await signPdfUrl(pdfPath) : null;
  const signedAt = doc.signed_at as string | undefined;
  const patientLang = (doc.patient_language as string) || "en";
  const isRtl = patientLang === "ar";

  const langToLocale: Record<string, string> = {
    en: "en-US",
    es: "es",
    fr: "fr",
    ar: "ar",
    zh: "zh",
    ko: "ko",
    vi: "vi",
    pt: "pt",
    ru: "ru",
    hi: "hi",
  };
  const locale = langToLocale[patientLang] || "en-US";

  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Clinic header */}
        <div className="flex items-center gap-3 mb-6">
          {clinicLogoUrl && (
            <img
              src={clinicLogoUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{clinicName}</h1>
          </div>
        </div>

        {/* Document card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {templateName}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {doctorName && <span>Document from Dr. {doctorName}</span>}
            {formattedDate && <span>Issued on {formattedDate}</span>}
          </div>

          {/* Document body */}
          <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
            {body}
          </div>
        </div>

        {/* Download button */}
        {pdfUrl && (
          <div className="mb-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download PDF
            </a>
          </div>
        )}

        {/* Keep for records note */}
        <p className="text-center text-xs text-gray-400 mb-4">
          Keep this document for your records.
        </p>

        {/* Footer */}
        <div className="text-center py-6">
          <a
            href="https://hilthealth.com"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by Hilt Health
          </a>
        </div>
      </div>
    </div>
  );
}
