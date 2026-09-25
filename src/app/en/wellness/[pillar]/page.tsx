import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalHub } from "@/components/wellness/PortalHub";
import { getPortal, portals } from "@/data/wellness-portals";
export const dynamic = 'force-dynamic';
export function generateStaticParams() { return portals.en.map((portal) => ({ pillar: portal.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ pillar: string }> }): Promise<Metadata> {
  const { pillar } = await params;
  const portal = getPortal("en", pillar);
  return portal ? { title: portal.name, description: portal.description, alternates: { canonical: `/en/wellness/${pillar}` } } : {};
}
export default async function Page({ params }: { params: Promise<{ pillar: string }> }) { const { pillar } = await params; const portal = getPortal("en", pillar); if (!portal) notFound(); return <PortalHub locale="en" portal={portal} />; }
