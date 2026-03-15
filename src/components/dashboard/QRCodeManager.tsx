"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { uploadLocationLogo } from "@/app/(dashboard)/d/_actions/locations";

export default function QRCodeManager({
  locationId,
  locationName,
  logoUrl,
}: {
  locationId: string;
  locationName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brandedQR, setBrandedQR] = useState(!!logoUrl);
  const [uploading, setUploading] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const [instructionText, setInstructionText] = useState(
    `Please scan this QR code to begin your check-in at ${locationName}.`
  );
  const [uploadError, setUploadError] = useState("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com";
  const checkinUrl = kioskMode
    ? `${appUrl}/checkin/${locationId}?kiosk=true`
    : `${appUrl}/checkin/${locationId}`;

  useEffect(() => {
    renderQR();
  }, [brandedQR, logoUrl, kioskMode]);

  useEffect(() => {
    setInstructionText(
      kioskMode
        ? `Scan this QR code on your check-in tablet to activate kiosk mode for ${locationName}.`
        : `Please scan this QR code to begin your check-in at ${locationName}.`
    );
  }, [kioskMode, locationName]);

  async function renderQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    await QRCode.toCanvas(canvas, checkinUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#ffffff" },
    });

    if (brandedQR && logoUrl) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const size = 112;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        // Center-crop to square from source image
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
        ctx.drawImage(img, sx, sy, side, side, x, y, size, size);
      };
      img.src = logoUrl;
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadLocationLogo(locationId, fd);
    setUploading(false);

    if (result.success) {
      setBrandedQR(true);
      router.refresh();
    } else {
      setUploadError(result.error || "Upload failed");
    }
  }

  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(locationName, pageWidth / 2, 30, { align: "center" });

    // QR code image
    const qrDataUrl = canvas.toDataURL("image/png");
    const qrSize = 100;
    pdf.addImage(
      qrDataUrl,
      "PNG",
      (pageWidth - qrSize) / 2,
      45,
      qrSize,
      qrSize
    );

    // Instruction text
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(instructionText, pageWidth - 40);
    pdf.text(lines, pageWidth / 2, 160, { align: "center" });

    // URL at bottom
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(checkinUrl, pageWidth / 2, 185, { align: "center" });

    pdf.save(`${locationName.replace(/\s+/g, "-").toLowerCase()}-qr.pdf`);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <canvas ref={canvasRef} className="rounded-lg" style={{ width: 256, height: 256 }} />
      </div>

      <p className="text-center text-xs text-slate mb-4 break-all">{checkinUrl}</p>

      <div className="mb-6 flex justify-center gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setKioskMode(false)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            !kioskMode ? "bg-white text-ink shadow-sm" : "text-slate"
          }`}
        >
          Patient QR
        </button>
        <button
          onClick={() => setKioskMode(true)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            kioskMode ? "bg-white text-ink shadow-sm" : "text-slate"
          }`}
        >
          Kiosk QR
        </button>
      </div>

      {kioskMode && (
        <p className="text-center text-xs text-slate mb-6">
          Scan this on your check-in tablet. Enable Guided Access (iPad) or use Fully Kiosk Browser (Android) to lock the device.
        </p>
      )}

      {logoUrl && (
        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={brandedQR}
              onChange={(e) => setBrandedQR(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-ink">Show logo in QR code</span>
          </label>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Upload Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploading}
            className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-gray-200"
          />
          {uploading && <p className="mt-1 text-xs text-slate">Uploading...</p>}
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Instruction Text (for PDF)
          </label>
          <textarea
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleDownloadPDF}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
