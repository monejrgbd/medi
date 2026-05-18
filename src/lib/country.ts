/**
 * Single source of truth for multi-country personalization.
 *
 * Detection: ?country=<googleLocId> → localStorage["hilt_country"] → GENERIC.
 * The inline detection script (buildDetectScript) and every server component
 * read from the maps here, so the client script and the rendered markup can
 * never drift.
 */

/** Google Ads location id → ISO-ish country key. From the campaign spec. */
export const GOOGLE_LOC_TO_COUNTRY: Record<string, string> = {
  "2036": "AU", "2048": "BH", "2124": "CA", "2196": "CY",
  "2208": "DK", "2233": "EE", "2242": "FJ", "2246": "FI",
  "2352": "IS", "2372": "IE", "2400": "JO", "2414": "KW",
  "2442": "LU", "2470": "MT", "2512": "OM", "2528": "NL",
  "2554": "NZ", "2578": "NO", "2630": "PR", "2634": "QA",
  "2682": "SA", "2702": "SG", "2752": "SE", "2784": "AE",
  "2826": "UK", "2840": "US",
};

/** Country key → display name (used in the trust signal). */
export const COUNTRY_NAME: Record<string, string> = {
  AU: "Australia", BH: "Bahrain", CA: "Canada", CY: "Cyprus",
  DK: "Denmark", EE: "Estonia", FJ: "Fiji", FI: "Finland",
  IS: "Iceland", IE: "Ireland", JO: "Jordan", KW: "Kuwait",
  LU: "Luxembourg", MT: "Malta", NL: "Netherlands", NZ: "New Zealand",
  NO: "Norway", OM: "Oman", PR: "Puerto Rico", QA: "Qatar",
  SA: "Saudi Arabia", SG: "Singapore", SE: "Sweden",
  AE: "United Arab Emirates", UK: "United Kingdom", US: "United States",
};

/**
 * Country key → compliance badge text. Verbatim from the campaign spec.
 * GENERIC lists the four major frameworks and is intentionally strong — it is
 * what the no-JS Google crawler sees.
 */
export const COMPLIANCE: Record<string, string> = {
  AU: "Privacy Act 1988 Compliant",
  BH: "PDPL Compliant",
  CA: "PHIPA + PIPEDA Compliant",
  CY: "EU GDPR Compliant",
  DK: "EU GDPR Compliant",
  EE: "EU GDPR Compliant",
  FJ: "Privacy Act 2020 Compliant",
  FI: "EU GDPR Compliant",
  IS: "GDPR Compliant",
  IE: "EU GDPR Compliant",
  JO: "PDPL Compliant",
  KW: "Data Privacy Protection Compliant",
  LU: "EU GDPR Compliant",
  MT: "EU GDPR Compliant",
  OM: "Personal Data Protection Compliant",
  NL: "EU GDPR Compliant",
  NZ: "Privacy Act 2020 + Health Info Code Compliant",
  NO: "GDPR Compliant",
  PR: "HIPAA Compliant",
  QA: "Personal Data Privacy Compliant",
  SA: "PDPL Compliant",
  SG: "PDPA Compliant",
  SE: "EU GDPR Compliant",
  AE: "PDPL Compliant",
  UK: "UK GDPR + Data Protection Act Compliant",
  US: "HIPAA + HITECH Compliant",
  GENERIC: "HIPAA + PIPEDA + GDPR + PDPA Compliant",
};

/** Country keys that use "GP surgery" instead of "clinic" (spec point 3). */
export const GP_SURGERY_COUNTRIES = ["UK", "IE"] as const;

/** All valid country keys (26), excluding GENERIC. */
export const COUNTRY_CODES = Object.values(GOOGLE_LOC_TO_COUNTRY);

/** Render order for the overlapping spans: 26 countries then GENERIC. */
export const ALL_VARIANTS = [...COUNTRY_CODES, "GENERIC"];

/**
 * ISO 3166-1 alpha-2 (e.g. Vercel's `x-vercel-ip-country` header) → internal
 * country code. Every supported code equals its ISO2 except the United
 * Kingdom, whose ISO2 is "GB" while we key it as "UK". Used only by the
 * server-side IP geo route; never affects SSR output.
 */
export const ISO2_TO_COUNTRY: Record<string, string> = {
  ...Object.fromEntries(COUNTRY_CODES.map((c) => [c, c])),
  GB: "UK",
};

/**
 * The detection logic, serialized for a blocking inline <script>. Runs before
 * first paint and sets data-country on #country-root, so there is no
 * GENERIC→country flash and the SSR default ("GENERIC") survives for crawlers.
 */
export function buildDetectScript(): string {
  const map = JSON.stringify(GOOGLE_LOC_TO_COUNTRY);
  return `(function(){try{var M=${map};var V=Object.keys(M).map(function(k){return M[k];});var p=new URLSearchParams(window.location.search);var g=p.get("country");var c;if(g&&M[g]){c=M[g];try{localStorage.setItem("hilt_country",c);}catch(e){}}else{try{var s=localStorage.getItem("hilt_country");}catch(e){}if(s&&V.indexOf(s)!==-1){c=s;}else{c="GENERIC";}}var el=document.getElementById("country-root");if(el){el.setAttribute("data-country",c);}}catch(e){}})();`;
}
