import type { NextConfig } from "next";

const SUPABASE_HOST = "https://sdzeoeturtpkqlagobwj.supabase.co";
const SUPABASE_WSS = "wss://sdzeoeturtpkqlagobwj.supabase.co";
const PAYPAL_HOSTS = "https://www.paypal.com https://www.sandbox.paypal.com";
const GTAG_HOSTS = "https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.ca";

const cspBase = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${PAYPAL_HOSTS} ${GTAG_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${SUPABASE_HOST} https://www.paypalobjects.com https://www.google.com https://www.google.ca https://www.googletagmanager.com`,
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_HOST} ${SUPABASE_WSS} ${PAYPAL_HOSTS} https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://region1.google-analytics.com`,
  `frame-src ${PAYPAL_HOSTS}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${SUPABASE_HOST}`,
];

const cspDefault = [...cspBase, "frame-ancestors 'none'"].join("; ");
const cspEmbed = [...cspBase, "frame-ancestors *"].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  headers: async () => [
    {
      source: "/((?!checkin).*)",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: cspDefault },
      ],
    },
    {
      source: "/checkin/:path*",
      headers: [
        { key: "Content-Security-Policy", value: cspEmbed },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
  ],
};

export default nextConfig;
