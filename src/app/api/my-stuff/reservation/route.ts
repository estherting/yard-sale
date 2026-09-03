import { NextRequest, NextResponse } from "next/server";
import { cancelReservationByEmail } from "@/lib/db";

// Cancel one of the caller's own reservations (frees the item). Verified by the
// email that placed the reservation.
export async function POST(request: NextRequest) {
  const { itemId, email } = await request.json();

  if (!itemId || !email) {
    return NextResponse.json(
      { error: "itemId and email are required" },
      { status: 400 }
    );
  }

  const removed = cancelReservationByEmail(Number(itemId), email);
  if (!removed) {
    return NextResponse.json(
      { error: "No matching reservation found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
