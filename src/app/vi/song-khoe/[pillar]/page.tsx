import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalHub } from "@/components/wellness/PortalHub";
import { getPortal, portals } from "@/data/wellness-portals";
export const dynamic = 'force-dynamic';
export function generateStaticParams() { return portals.vi.map((portal) => ({ pillar: portal.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ pillar: string }> }): Promise<Metadata> {
  const { pillar } = await params;
  const portal = getPortal("vi", pillar);
  return portal ? { title: portal.name, description: portal.description, alternates: { canonical: `/vi/song-khoe/${pillar}` } } : {};
}
export default async function Page({ params }: { params: Promise<{ pillar: string }> }) { const { pillar } = await params; const portal = getPortal("vi", pillar); if (!portal) notFound(); return <PortalHub locale="vi" portal={portal} />; }
