import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hilthealth — AI Patient Pre-Screening for Clinics",
  description:
    "Hilthealth uses AI to pre-screen patients before they see the doctor. Less time asking questions. More time treating. Now expanding to the Niagara region.",
  openGraph: {
    title: "Hilthealth — AI Patient Pre-Screening for Clinics",
    description:
      "Cut intake time by up to 50%. AI-powered pre-screening that patients love.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
