import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CalConversionTracker from "@/components/marketing/CalConversionTracker";
import ClickIdCapture from "@/components/marketing/ClickIdCapture";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hilthealth.com"),
  title: "Hilt Health — AI Patient Pre-Screening for Clinics",
  description:
    "Hilt Health uses AI to pre-screen patients before they see the doctor. Less time asking questions. More time treating. Now expanding to the Niagara region.",
  openGraph: {
    title: "Hilt Health — AI Patient Pre-Screening for Clinics",
    description:
      "Cut intake time by up to 50%. AI-powered pre-screening that patients love.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18032484152"
        strategy="afterInteractive"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18032484152');
          gtag('config', 'G-DBXWVWNBJP');
        `}
      </Script>
      <body className="antialiased">
        <CalConversionTracker />
        <ClickIdCapture />
        {children}
      </body>
    </html>
  );
}
