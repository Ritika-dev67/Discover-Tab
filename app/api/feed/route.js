import { NextResponse } from "next/server";
import { getFeed } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/feed -> profiles the user has not swiped on yet
export async function GET() {
  return NextResponse.json({ profiles: getFeed() });
}
