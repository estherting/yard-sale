import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const added = addSubscriber(email.trim().toLowerCase());

  if (!added) {
    return NextResponse.json({ message: "You're already subscribed!" });
  }

  return NextResponse.json({ message: "Subscribed!" }, { status: 201 });
}
