import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Where uploaded photos are stored. Defaults to public/uploads for local dev;
// in production set UPLOAD_DIR to a path outside the app folder (served by the
// reverse proxy) so photos survive redeploys and aren't tied to the build.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(UPLOAD_DIR, { recursive: true });
  const uploadPath = path.join(UPLOAD_DIR, filename);
  await writeFile(uploadPath, buffer, { mode: 0o644 });

  return NextResponse.json({ path: `/uploads/${filename}` });
}
