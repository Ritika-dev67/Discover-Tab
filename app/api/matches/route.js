import { NextResponse } from "next/server";
import { getMatches } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/matches -> mutual matches only, newest first
export async function GET() {
  return NextResponse.json({ matches: getMatches() });
}
