import { ISO2_TO_COUNTRY } from "@/lib/country";

/**
 * Edge geo lookup for the IP fallback (lowest priority in the detection
 * chain). Reads Vercel's `x-vercel-ip-country` (ISO2) and maps it to an
 * internal country code, or null if the country is not supported.
 *
 * Guardrails:
 *  - `force-dynamic` + `Cache-Control: no-store`: the response is per-request
 *    and must never be cached by the CDN (would leak one visitor's country to
 *    others).
 *  - This route never influences SSR. The marketing pages still render
 *    data-country="GENERIC" for everyone, so Googlebot always sees the global
 *    page; only the client (CountryDetector) consults this, and only when
 *    there is no explicit ?country= param or stored choice.
 *  - On localhost the header is absent → returns { country: null } (no-op).
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const iso2 = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  const country = ISO2_TO_COUNTRY[iso2] ?? null;
  return Response.json(
    { country },
    { headers: { "Cache-Control": "no-store" } },
  );
}
