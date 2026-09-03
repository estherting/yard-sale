import { NextRequest, NextResponse } from "next/server";
import { getReservationsByEmail, getWaitlistByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const reserved = getReservationsByEmail(email);
  const waitlisted = getWaitlistByEmail(email);

  return NextResponse.json({ reserved, waitlisted });
}
