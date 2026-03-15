"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const CHECKIN_URL =
  `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/6e52c30b-c40c-4ec2-81c4-a37e89c0b03b`;
const LOGO_URL =
  "https://sdzeoeturtpkqlagobwj.supabase.co/storage/v1/object/public/logos/a24d1aa1-2ae0-4022-b242-9a7dc30fc4b0/6e52c30b-c40c-4ec2-81c4-a37e89c0b03b/logo?v=1773603057168";

export default function DemoQR() {
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
      style={{ width: 100, height: 100 }}
    />
  );
}
