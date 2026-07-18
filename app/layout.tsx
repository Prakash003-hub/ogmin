import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "OG Link Generator",
  description: "Create shareable links with custom Open Graph previews."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
