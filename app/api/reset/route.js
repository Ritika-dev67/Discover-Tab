import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/reset -> clears all swipes and matches (demo helper, not part of the core API)
export async function POST() {
  resetDb();
  return NextResponse.json({ ok: true });
}
