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
      width: 256,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#ffffff" },
    });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 56;
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;

      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
      ctx.drawImage(img, sx, sy, side, side, x, y, size, size);
    };
    img.src = LOGO_URL;
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
