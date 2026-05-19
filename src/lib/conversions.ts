/**
 * Google Ads conversion firing — single source of truth.
 *
 * Every email entry point (homepage HeroEmailCTA, feature-page TrialEmailCTA,
 * and the Apply for Premium Trial SignUpForm) MUST fire the conversion through
 * this helper. The original bug was the tag being wired into one component and
 * silently missing from the others; centralizing it here makes that drift
 * impossible — there is exactly one send_to and one transaction_id scheme.
 */

// "Email Capture" conversion action (Google Ads account AW-18032484152).
const EMAIL_CAPTURE_SEND_TO = "AW-18032484152/P8SxCPDbpZccELi-x5ZD";

export interface AdsUserIdentifiers {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Feed user-provided data for Google Ads Enhanced Conversions. The conversion
 * actions are configured "Managed through Google Tag", so gtag SHA-256-hashes
 * these values in the browser before they are sent; we pass cleartext. Call
 * this immediately before firing the conversion event. Safe no-op when gtag is
 * unavailable or no identifiers are present.
 */
export function setAdsUserData(ids: AdsUserIdentifiers): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const email = ids.email?.trim().toLowerCase();
  const phone = ids.phoneNumber?.trim();
  const first = ids.firstName?.trim();
  const last = ids.lastName?.trim();
  if (!email && !phone && !first && !last) return;

  const userData: Record<string, unknown> = {};
  if (email) userData.email = email;
  if (phone) userData.phone_number = phone;
  if (first || last) {
    userData.address = {
      ...(first ? { first_name: first } : {}),
      ...(last ? { last_name: last } : {}),
    };
  }
  try {
    window.gtag("set", "user_data", userData);
  } catch {
    // Enhanced Conversions are best effort; never block the conversion.
  }
}

/**
 * Fire the "Email Capture" Google Ads conversion.
 *
 * transaction_id is the normalized email, so the same person submitting on the
 * homepage hero and later on the full application form dedups to a single
 * conversion (the action is configured "Count: one conversion").
 *
 * Best effort and non-blocking: if gtag is absent or blocked, or the beacon is
 * slow, `onDone` still runs. A 1s timeout guarantees `onDone` fires even when
 * `event_callback` never does, so callers that navigate on completion are
 * never trapped behind a blocked tag.
 *
 * @param email  Raw email the visitor submitted.
 * @param onDone Optional. Invoked exactly once when it is safe to proceed
 *               (e.g. to navigate away). Always called, even on failure.
 */
export function fireEmailCaptureConversion(email: string, onDone?: () => void): void {
  const normalized = email.trim().toLowerCase();

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    onDone?.();
  };

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    finish();
    return;
  }

  // Navigation must never hang on a slow or ad-blocked beacon.
  window.setTimeout(finish, 1000);

  // Enhanced Conversions: attach the captured email before the event.
  setAdsUserData({ email });

  try {
    window.gtag("event", "conversion", {
      send_to: EMAIL_CAPTURE_SEND_TO,
      transaction_id: normalized ? `email-${normalized}` : undefined,
      event_callback: finish,
    });
  } catch {
    finish();
  }
}
