import type { Metadata } from "next";
import { listLinks } from "@/lib/store";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "OG Link Generator · Admin",
  robots: { index: false, follow: false }
};

// Always read fresh data - this is an admin tool, not a cached marketing page.
export const dynamic = "force-dynamic";

export default async function OgGeneratorPage() {
  const links = await listLinks();
  return <AdminDashboard initialLinks={links} />;
}
