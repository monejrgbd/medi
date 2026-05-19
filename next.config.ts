import type { NextConfig } from "next";

const SUPABASE_HOST = "https://sdzeoeturtpkqlagobwj.supabase.co";
const SUPABASE_WSS = "wss://sdzeoeturtpkqlagobwj.supabase.co";
const PAYPAL_HOSTS = "https://www.paypal.com https://www.sandbox.paypal.com";
const GOOGLE_HOSTS = "https://google.com https://*.google.com https://google.ca https://*.google.ca https://googletagmanager.com https://*.googletagmanager.com https://google-analytics.com https://*.google-analytics.com https://doubleclick.net https://*.doubleclick.net https://*.googleapis.com https://googleadservices.com https://*.googleadservices.com https://googlesyndication.com https://*.googlesyndication.com";

const cspBase = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${PAYPAL_HOSTS} ${GOOGLE_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${SUPABASE_HOST} https://www.paypalobjects.com ${GOOGLE_HOSTS}`,
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_HOST} ${SUPABASE_WSS} ${PAYPAL_HOSTS} ${GOOGLE_HOSTS}`,
  `frame-src ${PAYPAL_HOSTS}`,
  `media-src 'self' blob: ${SUPABASE_HOST}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${SUPABASE_HOST}`,
];

const cspDefault = [...cspBase, "frame-ancestors 'none'"].join("; ");
const cspEmbed = [...cspBase, "frame-ancestors *"].join("; ");

// PHI / authenticated app route prefixes that must keep the strict
// `no-referrer` posture. `checkin` is intentionally excluded here: it has its
// own block (embed CSP) and is handled separately. Both the strict block and
// the marketing catch-all are derived from this single list so they can never
// drift and leave a route with no security headers. Patterns are segment
// anchored (`(?:/|$)`), so e.g. `/demo` and `/services` are NOT treated as
// `/d` or `/s`.
const STRICT_PREFIXES = [
  "d",
  "summary",
  "review",
  "queue",
  "s",
  "auth",
  "reset-password",
  "update-password",
];
const strictAlt = STRICT_PREFIXES.join("|");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  headers: async () => [
    // 1. Embeddable check-in: relaxed framing CSP, strict referrer. Unchanged.
    {
      source: "/checkin/:path*",
      headers: [
        { key: "Content-Security-Policy", value: cspEmbed },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    // 2. PHI / authenticated app: keep the strict no-referrer posture.
    //    Segment anchored so /demo, /services, etc. do NOT match here.
    {
      source: `/((?:${strictAlt})(?:/.*)?)`,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: cspDefault },
      ],
    },
    // 3. Everything else (marketing + ad-landing: /, /features/*, /pricing,
    //    /signup, /login, /demo, ...): relax Referrer-Policy so Google Ads can
    //    attribute conversions. Excludes checkin + the strict prefixes,
    //    segment anchored so no path is ever left without CSP.
    {
      source: `/((?!(?:checkin|${strictAlt})(?:/|$)).*)`,
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: cspDefault },
      ],
    },
  ],
};

export default nextConfig;
