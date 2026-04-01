"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { toggleQueueDisplay } from "@/app/(dashboard)/d/_actions/locations";

export default function QRCodeManager({
  locationId,
  locationName,
  logoUrl,
  queueDisplayEnabled,
}: {
  locationId: string;
  locationName: string;
  logoUrl: string | null;
  queueDisplayEnabled: boolean;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [queueEnabled, setQueueEnabled] = useState(queueDisplayEnabled);
  const [toggling, setToggling] = useState(false);
  const [brandedQR, setBrandedQR] = useState(!!logoUrl);
  const [mode, setMode] = useState<"patient" | "kiosk" | "queue">("patient");
  const [instructionText, setInstructionText] = useState(
    `Please scan this QR code to begin your check-in at ${locationName}.`
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com";
  const targetUrl =
    mode === "kiosk"
      ? `${appUrl}/checkin/${locationId}?kiosk=true`
      : mode === "queue"
        ? `${appUrl}/queue/${locationId}`
        : `${appUrl}/checkin/${locationId}`;

  useEffect(() => {
    renderQR();
  }, [brandedQR, logoUrl, mode, queueEnabled]);

  useEffect(() => {
    setInstructionText(
      mode === "kiosk"
        ? `Scan this QR code on your check-in tablet to activate kiosk mode for ${locationName}.`
        : mode === "queue"
          ? `Open this link on your waiting room TV or monitor. Bookmark it for daily use.`
          : `Please scan this QR code to begin your check-in at ${locationName}.`
    );
  }, [mode, locationName]);

  async function renderQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    await QRCode.toCanvas(canvas, targetUrl, {
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
    pdf.text(targetUrl, pageWidth / 2, 185, { align: "center" });

    pdf.save(`${locationName.replace(/\s+/g, "-").toLowerCase()}-qr.pdf`);
  }

  const hideQR = mode === "queue" && !queueEnabled;

  return (
    <div className="max-w-md mx-auto">
      {!hideQR && (
        <>
          <div className="flex justify-center mb-6">
            <canvas ref={canvasRef} className="rounded-lg" style={{ width: 256, height: 256 }} />
          </div>
          <p className="text-center text-xs text-slate mb-4 break-all">{targetUrl}</p>
        </>
      )}

      <div className="mb-6 flex justify-center gap-1 rounded-lg bg-gray-100 p-1">
        {(["patient", "kiosk", "queue"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m ? "bg-white text-ink shadow-sm" : "text-slate"
            }`}
          >
            {m === "patient" ? "Patient QR" : m === "kiosk" ? "Kiosk QR" : "Queue Display"}
          </button>
        ))}
      </div>

      {mode === "kiosk" && (
        <p className="text-center text-xs text-slate mb-6">
          Scan this on your check-in tablet. Enable Guided Access (iPad) or use Fully Kiosk Browser (Android) to lock the device.
        </p>
      )}

      {mode === "queue" && (
        <div className="mb-6 space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-ink">Enable Queue Display</span>
              <p className="text-xs text-ash mt-0.5">Shows patients their queue number after check in and activates this TV screen.</p>
            </div>
            <input
              type="checkbox"
              checked={queueEnabled}
              disabled={toggling}
              onChange={async (e) => {
                const val = e.target.checked;
                setToggling(true);
                setQueueEnabled(val);
                const result = await toggleQueueDisplay(locationId, val);
                if (!result.success) setQueueEnabled(!val);
                router.refresh();
                setToggling(false);
              }}
              className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
            />
          </label>

          {queueEnabled ? (
            <p className="text-center text-xs text-slate">
              Open this link on your waiting room TV or monitor. Displays who is being served now and who is up next using queue numbers patients get after entering the queue only, no patient names.
            </p>
          ) : (
            <p className="text-center text-xs text-ash">
              Enable queue display above to generate the TV screen link and show patients their queue number.
            </p>
          )}
        </div>
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
