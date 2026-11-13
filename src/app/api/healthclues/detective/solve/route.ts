import { handleDetectiveSolvePost } from "@gametrinhtham/services/api-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleDetectiveSolvePost(request);
}
