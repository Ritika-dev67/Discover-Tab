import { NextResponse } from "next/server";
import { recordSwipe } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/swipe  body: { profileId: number, action: "like" | "pass" }
// -> { match: boolean, profile?: PublicProfile }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { profileId, action } = body || {};
  if (action !== "like" && action !== "pass") {
    return NextResponse.json({ error: 'action must be "like" or "pass"' }, { status: 400 });
  }
  if (!Number.isInteger(profileId)) {
    return NextResponse.json({ error: "profileId must be an integer" }, { status: 400 });
  }

  const result = recordSwipe(profileId, action);
  if (result.notFound) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
