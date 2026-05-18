# Multi-Country Homepage & Feature-Page Personalization — Design

**Date:** 2026-05-18
**Status:** Approved (pending spec review)
**Scope:** Homepage + `/features/patient-intake` + `/features/ai-scribe-and-paperwork`

## Goal

Personalize compliance/trust messaging for 26 supported countries (+ a strong
GENERIC fallback) without rebuilding any design, layout, copy, or hierarchy.
Detection is by Google location id URL param, persisted in localStorage. The
GENERIC variant is what the no-JS Google Quality Score crawler sees and must
remain a strong standalone page.

This is a Next.js App Router app with React **server components** (the original
spec assumed a static HTML/JS page). The design below adapts the spec's intent
to that reality without changing its behavior.

## Locked decisions

- **Placement: Hybrid.** Country-aware compliance appears both as the
  scannable trust-section badge and, where a hero proof strip exists or is
  added, in that prominent near-the-top strip. H1s stay value-first.
- **No flash.** A blocking inline `<head>`/top-of-body script sets the country
  before first paint. Returning `localStorage="CA"` visitors never see a
  GENERIC→CA flash.
- **GENERIC is the server-rendered default** so the no-JS crawler sees a strong
  page.
- **Flag A resolved:** patient-intake gets a *new* hero proof strip matching
  ai-scribe's existing one. ai-scribe uses its existing hero proof strip.
- **Trust signal — REVERTED (post-review decision).** Hilt has no real
  customers anywhere (codebase: "mechanism-as-proof until real testimonials
  exist"; the clinic marquee is invented US-style names). "Trusted by clinics
  in {country}" is therefore a false, falsifiable claim and an
  advertising/credibility risk. Decision: the trust line stays the static
  "Trusted by clinics worldwide" for everyone. The `TrustSignal` component was
  deleted. The country-aware compliance badge is unaffected.
- **Flag B / GP-surgery — BROADENED (post-review decision).** clinic→"GP
  surgery" (UK/IE) now covers genuine hero/value-prop copy: homepage H1
  ("AI for your clinic." → reopened, it is the one true hero line and the
  whole point of UK/IE feeling at home), homepage value-prop lines (AIJourney
  "Some clinics want…", BeforeAfter headline "Your clinic is losing…"),
  patient-intake eyebrow + the "Stop turning patients away" value line.
  **ai-scribe gets none on purpose:** its hero/value-prop has no practice-noun
  "clinic"; the only occurrence is the idiom "two clinic days" (a unit of
  time) — swapping it to "two GP surgery days" would degrade the copy. Blind
  terminology swapping is explicitly avoided where it harms readability.

## Architecture

### Single source of truth: `src/lib/country.ts`

Exports, no duplication anywhere else:

- `GOOGLE_LOC_TO_COUNTRY` — the 26-entry map from the spec.
- `COUNTRY_NAME` — 26 display names (Australia … United States).
- `COMPLIANCE` — 27 strings: the 26 country badges from the spec plus
  `GENERIC: "HIPAA + PIPEDA + GDPR + PDPA Compliant"`.
- `COUNTRY_CODES` — `Object.values(GOOGLE_LOC_TO_COUNTRY)` for validation.
- `buildDetectScript()` — returns the detection logic as a string, with the
  map injected via `JSON.stringify(GOOGLE_LOC_TO_COUNTRY)`, so the inline
  script and TS module never drift.

Detection logic (spec, unchanged): URL `?country=<googleLocId>` →
`localStorage["hilt_country"]` → `"GENERIC"`. A valid URL param is written to
localStorage. Invalid param falls through to localStorage then GENERIC.

### Marketing layout (`src/app/(marketing)/layout.tsx`)

Wrap children:

```
<div id="country-root" data-country="GENERIC" suppressHydrationWarning>
  <script dangerouslySetInnerHTML={{ __html: buildDetectScript() }} />
  {children}
</div>
```

- `data-country="GENERIC"` is **server-rendered literally**, so view-source /
  the no-JS crawler always sees GENERIC content. The spec's CSS pattern then
  works verbatim — no special "absent attribute" CSS needed.
- The inline script is the **first child** of `#country-root`. A synchronous
  inline script blocks parse/paint at its position, so it overwrites
  `data-country` before any personalized content paints → zero flash.
- `suppressHydrationWarning` prevents a React hydration warning from the
  script's pre-hydration attribute mutation (the next-themes pattern). Nothing
  in React renders off this attribute — only CSS reads it — so this is safe.
- `CountryDetector` (`"use client"`, render after the inline script): a
  `useEffect` that re-runs detection and re-applies `data-country` on
  `#country-root`. Covers client-side navigation that lands on a `?country=`
  URL (the inline script only fires on hard load). Renders nothing.

Deviation from spec, documented: the spec says set the attribute on
`document.body`. We use a `#country-root` wrapper div instead because (a) `body`
is owned by the root layout, not the marketing layout (smaller blast radius,
no root-layout change), and (b) a server-rendered wrapper lets GENERIC be the
SSR default. The spec's CSS uses a descendant combinator, so an ancestor
wrapper div behaves identically to body.

### Global CSS (`src/app/globals.css`)

The spec's exact pattern, appended:

```
[data-show-for]{display:none}
[data-country="AU"] [data-show-for="AU"]{display:inline}
… all 26 …
[data-country="GENERIC"] [data-show-for="GENERIC"]{display:inline}
```

### Reusable server components (`src/components/marketing/country/`)

Keeps the page edits one-line and DRY. All are server components — they emit
static `<span data-show-for>` markup; CSS does the showing/hiding.

- `<ComplianceText/>` — maps `COMPLIANCE` to 27 overlapping spans.
- `<TrustSignal/>` — `GENERIC`: "Trusted by clinics worldwide";
  per country: "Trusted by clinics in {COUNTRY_NAME}".
- `<ClinicTerm plural?/>` — UK & IE: "GP surgery" / "GP surgeries";
  all other countries + GENERIC: "clinic" / "clinics".

## Exact edits

| Page | Compliance badge | Hero proof (prominent) | Trust signal | Clinic→GP |
|---|---|---|---|---|
| homepage `page.tsx` | `:1328` label → `<ComplianceText/>` | none (hierarchy rule — no new strip) | static "Trusted by clinics worldwide" (TrustSignal reverted/deleted) | H1 "AI for your clinic." + "Some clinics want…" + "Your clinic is losing…" → `<ClinicTerm/>` |
| patient-intake | `:451` `TRUST_BADGES[0]` → `<ComplianceText/>` | **NEW** strip (see below) | none exists | eyebrow "Built for `<ClinicTerm plural/>`, by clinicians" + "walks to the `<ClinicTerm/>` down the street" |
| ai-scribe | `:507` `TRUST_BADGES[0]` → `<ComplianceText/>` | `:220` existing hero proof item → `<ComplianceText/>` | none exists | none — only occurrence is the idiom "two clinic days"; swapping would degrade copy |

The homepage `:1328` badge is currently a string inside a `badges` array
mapped to JSX; that one entry is refactored so its label renders
`<ComplianceText/>` instead of a plain string (icon/pill markup unchanged).
Same approach for the `TRUST_BADGES[0]` string entries on the feature pages.

**New patient-intake hero strip — exact placement:** mirror ai-scribe's hero
proof `<ul>` (currently `ai-scribe :216-227`: a `flex flex-wrap` list of
`IconCheck` + text items). Insert the same markup into the patient-intake hero
left column as the last child of the text `<div>` (after the
"Prefer a walkthrough?" book link `:169-176`, before that `<div>` closes at
`:177`). Items: "2M+ visits processed", "About 8 minutes saved per patient",
and a third whose text is `<ComplianceText/>`. Reuse patient-intake's existing
`IconCheck` and Tailwind classes so it is visually identical to ai-scribe's.

## Out of scope / flagged, not edited

- `ai-scribe-and-paperwork/page.tsx:705` FAQ — *"Is this HIPAA and PHIPA
  compliant?"* and its answer. Canada-leaning body copy, outside the three
  personalization targets. Flagged for the user's review per their
  instruction; left unchanged.
- No cookie banner (localStorage personalization, per spec).
- No pricing, flow, section, or visual-design changes.
- Sweep confirms no other Canada-specific copy (no "Canada", "Ontario",
  "OHIP", "CAD", province names, `.ca`) anywhere in the three pages — the only
  Canadian signal is `PHIPA`, which only appears inside the badges being
  replaced.

## Testing

Spec scenarios 1–5:
1. No param + empty localStorage → GENERIC badge + "Trusted by clinics
   worldwide".
2. `?country=2124` → CA badge ("PHIPA + PIPEDA Compliant"), "Trusted by
   clinics in Canada", localStorage="CA".
3. Return visit, localStorage="CA", no param → CA still shows.
4. `?country=9999` → GENERIC.
5. Each of the 26 codes → correct badge + trust signal (+ patient-intake
   eyebrow shows "GP surgeries" only for UK/IE).

Additional:
- `next build` + typecheck pass.
- View-source with JS disabled: `data-country="GENERIC"` and full GENERIC
  compliance/trust text present in the HTML (crawler safety).
- No GENERIC→country flash on a hard reload with localStorage="CA".
- Client-side nav between the three marketing pages preserves the active
  country.
