import { NextRequest, NextResponse } from "next/server";
import { removeWaitlistByEmail } from "@/lib/db";

// Remove one of the caller's own waitlist entries. Verified by the email on the entry.
export async function POST(request: NextRequest) {
  const { entryId, email } = await request.json();

  if (!entryId || !email) {
    return NextResponse.json(
      { error: "entryId and email are required" },
      { status: 400 }
    );
  }

  const removed = removeWaitlistByEmail(Number(entryId), email);
  if (!removed) {
    return NextResponse.json(
      { error: "No matching waitlist entry found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
