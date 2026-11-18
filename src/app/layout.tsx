import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WireLab: The Mystery Wire",
  description: "Inquiry lab on wire resistance — length, area and material (Class 10). ET617 · 24B3926",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f7f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
