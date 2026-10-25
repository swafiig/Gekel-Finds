import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display", weight: ["500", "700", "800"], display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--f-body", weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = { title: { default: "GEKEL Ops Console", template: "%s · GEKEL Ops" }, description: "Operations console for GEKEL: orders, dispatch, supplier verification, disputes and fee payments.", icons: { icon: "/mark-brand.png" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
