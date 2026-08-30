import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function generateToken(password: string): string {
  return crypto
    .createHmac("sha256", password)
    .update("yard-sale-admin")
    .digest("hex");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Admin password not configured" },
      { status: 500 }
    );
  }

  if (
    !password ||
    password.length !== adminPassword.length ||
    !crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(adminPassword)
    )
  ) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const token = generateToken(adminPassword);
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
