import { COUNTRY_CODES, COUNTRY_NAME } from "@/lib/country";

// The four supported countries whose names take a definite article:
// "the United Kingdom/United States/United Arab Emirates/Netherlands".
const TAKES_THE = new Set(["UK", "US", "AE", "NL"]);

/**
 * Country-aware presence line. A factual availability/compliance claim (not a
 * customer endorsement, which would be unsubstantiated with no local customers
 * and a Google Ads policy risk). GENERIC: "Operating worldwide". Per country:
 * "Operating and compliant in [the ]{country}". Overlapping spans, CSS picks
 * the active one; GENERIC is the SSR default so the no-JS crawler sees it.
 */
export default function TrustSignal() {
  return (
    <>
      <span data-show-for="GENERIC">Operating worldwide</span>
      {COUNTRY_CODES.map((code) => (
        <span key={code} data-show-for={code}>
          Operating and compliant in {TAKES_THE.has(code) ? "the " : ""}{COUNTRY_NAME[code]}
        </span>
      ))}
    </>
  );
}
