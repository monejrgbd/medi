import { ISO2_TO_COUNTRY } from "@/lib/country";
import { edgeCountryISO2, edgeGeoDebug } from "@/lib/edge-geo";

/**
 * Edge geo lookup for the IP fallback (lowest priority in the detection
 * chain). Resolves the visitor's ISO2 via the host's geo signal (Netlify
 * `x-nf-geo` here) and maps it to an internal country code, or null when the
 * country is unsupported / geolocation is unavailable.
 *
 * Guardrails:
 *  - `force-dynamic` + `Cache-Control: no-store`: per-request, never cached by
 *    the CDN (would leak one visitor's country to others).
 *  - Never influences SSR. Marketing pages still render
 *    data-country="GENERIC" for everyone, so Googlebot always sees the global
 *    page; only the client (CountryDetector) consults this, and only when
 *    there is no explicit ?country= param or stored choice.
 *  - `?debug=1` echoes the raw candidate headers so the live deploy can be
 *    inspected (which header actually carries the country) without guessing.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const headers = { "Cache-Control": "no-store" };

  if (url.searchParams.get("debug") === "1") {
    return Response.json(edgeGeoDebug(request.headers), { headers });
  }

  const iso2 = edgeCountryISO2(request.headers);
  const country = iso2 ? (ISO2_TO_COUNTRY[iso2] ?? null) : null;
  return Response.json({ country }, { headers });
}
