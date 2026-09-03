import { NextRequest, NextResponse } from "next/server";
import {
  getItem,
  getWaitlist,
  addToWaitlist,
  removeFromWaitlist,
  isEmailOnWaitlist,
} from "@/lib/db";
import { sendWaitlistNotification } from "@/lib/email";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const waitlist = getWaitlist(Number(id));
  return NextResponse.json(waitlist);
}

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

  if (item.status !== "reserved") {
    return NextResponse.json(
      { error: "Waitlist is only available for reserved items" },
      { status: 409 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (
    item.reserved_email &&
    item.reserved_email.trim().toLowerCase() === normalizedEmail
  ) {
    return NextResponse.json(
      { error: "You've already reserved this item." },
      { status: 409 }
    );
  }

  if (isEmailOnWaitlist(Number(id), email)) {
    return NextResponse.json(
      { error: "You're already on the waitlist for this item." },
      { status: 409 }
    );
  }

  const entryId = addToWaitlist(Number(id), name, email);

  sendWaitlistNotification({
    title: item.title,
    price: item.price,
    name,
    email: email || null,
  }).catch(() => {});

  return NextResponse.json({ id: entryId }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json(
      { error: "entryId is required" },
      { status: 400 }
    );
  }

  removeFromWaitlist(Number(entryId));
  return NextResponse.json({ success: true });
}
