import { handleDetectiveCampaignGet } from "@gametrinhtham/services/api-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleDetectiveCampaignGet(request);
}
