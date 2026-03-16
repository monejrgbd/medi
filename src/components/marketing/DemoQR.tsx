"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const DEMO_LOCATION_ID = process.env.NEXT_PUBLIC_DEMO_LOCATION_ID!;
const DEMO_ORG_ID = process.env.NEXT_PUBLIC_DEMO_ORG_ID!;
const CHECKIN_URL =
  `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/${DEMO_LOCATION_ID}`;
const LOGO_URL =
  `https://sdzeoeturtpkqlagobwj.supabase.co/storage/v1/object/public/logos/${DEMO_ORG_ID}/${DEMO_LOCATION_ID}/logo`;

export default function DemoQR({ size = 100 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderQR();
  }, []);

  async function renderQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    await QRCode.toCanvas(canvas, CHECKIN_URL, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#ffffff" },
    });

  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
