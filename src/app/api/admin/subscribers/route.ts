import { NextRequest, NextResponse } from "next/server";
import { getAllSubscribers, removeSubscriber } from "@/lib/db";

export async function GET() {
  const subscribers = getAllSubscribers();
  return NextResponse.json(subscribers);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  removeSubscriber(Number(id));
  return NextResponse.json({ success: true });
}
