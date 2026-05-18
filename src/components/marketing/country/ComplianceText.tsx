import { ALL_VARIANTS, COMPLIANCE } from "@/lib/country";

/**
 * Country-aware compliance text. Renders all 27 variants as overlapping
 * spans; global CSS shows only the one matching #country-root[data-country].
 * GENERIC is the SSR default, so the no-JS crawler sees the strong
 * four-framework string.
 */
export default function ComplianceText() {
  return (
    <>
      {ALL_VARIANTS.map((code) => (
        <span key={code} data-show-for={code}>
          {COMPLIANCE[code]}
        </span>
      ))}
    </>
  );
}
