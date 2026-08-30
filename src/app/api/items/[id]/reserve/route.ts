import { NextRequest, NextResponse } from "next/server";
import { reserveItem, getItem } from "@/lib/db";
import { sendReservationNotification } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  const item = getItem(Number(id));
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "available") {
    return NextResponse.json(
      { error: "Item is no longer available" },
      { status: 409 }
    );
  }

  const success = reserveItem(Number(id), name, email);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to reserve item" },
      { status: 409 }
    );
  }

  sendReservationNotification({
    title: item.title,
    price: item.price,
    reservedBy: name,
    reservedEmail: email,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
