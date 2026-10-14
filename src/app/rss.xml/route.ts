import { GET as getWellnessRss } from '../api/rss/wellness/route';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

export async function GET(request: Request) {
  return getWellnessRss(request);
}
