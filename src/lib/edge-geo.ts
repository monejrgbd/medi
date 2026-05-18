/**
 * Host-correct visitor-country extraction from request headers.
 *
 * hilthealth.com is deployed on **Netlify**, which exposes geolocation via the
 * base64-encoded JSON `x-nf-geo` header (the same data Edge Functions get as
 * `context.geo`). `x-vercel-ip-country` is Vercel-only and is never set here.
 *
 * We read Netlify first, then a few other platforms' signals as harmless
 * fallbacks, so this is not coupled to one host. Returns an uppercase ISO2
 * code, or null when geolocation is unavailable (e.g. local dev) — callers
 * then fall back to GENERIC / no prefill.
 */

const ISO2_RE = /^[A-Z]{2}$/;

/** Minimal shape shared by web `Headers` and Next's `ReadonlyHeaders`. */
type HeaderGetter = { get(name: string): string | null };

function decodeBase64(value: string): string | null {
  try {
    if (typeof atob === "function") return atob(value);
  } catch {
    /* unavailable or invalid */
  }
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/** Netlify `x-nf-geo`: base64 JSON whose `.country.code` is the ISO2. */
function netlifyCountry(headers: HeaderGetter): string | null {
  const raw = headers.get("x-nf-geo");
  if (!raw) return null;
  const json = decodeBase64(raw);
  if (!json) return null;
  try {
    const geo = JSON.parse(json) as { country?: { code?: string } };
    const code = geo?.country?.code?.toUpperCase();
    return code && ISO2_RE.test(code) ? code : null;
  } catch {
    return null;
  }
}

function plainHeader(headers: HeaderGetter, name: string): string | null {
  const v = headers.get(name)?.trim().toUpperCase();
  return v && ISO2_RE.test(v) ? v : null;
}

/** Visitor ISO2 country, host-agnostic. Netlify first, then fallbacks. */
export function edgeCountryISO2(headers: HeaderGetter): string | null {
  return (
    netlifyCountry(headers) ||
    plainHeader(headers, "x-country") ||
    plainHeader(headers, "x-vercel-ip-country") ||
    plainHeader(headers, "cf-ipcountry") ||
    null
  );
}

/** Raw candidate values — for the /api/geo?debug=1 ground-truth check. */
export function edgeGeoDebug(
  headers: HeaderGetter,
): Record<string, string | null> {
  return {
    "x-nf-geo": headers.get("x-nf-geo"),
    "x-country": headers.get("x-country"),
    "x-vercel-ip-country": headers.get("x-vercel-ip-country"),
    "cf-ipcountry": headers.get("cf-ipcountry"),
    resolved: edgeCountryISO2(headers),
  };
}
