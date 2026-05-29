import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hilt Health, AI Patient Intake Software for Clinics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #059669 140%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            opacity: 0.95,
          }}
        >
          Hilt Health
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: 980,
            }}
          >
            AI Patient Intake Software
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              opacity: 0.88,
              maxWidth: 960,
            }}
          >
            For clinics. 130+ languages. HIPAA compliant. Saves 8 minutes per visit.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            fontWeight: 600,
            opacity: 0.85,
          }}
        >
          <div>hilthealth.com</div>
          <div>Start free, no credit card</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
