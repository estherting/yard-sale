import { NextRequest, NextResponse } from "next/server";
import { getAllItems, createItem, addItemPhoto } from "@/lib/db";

export async function GET() {
  const items = getAllItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, price, dimensions, description, main_photo, extra_photos } =
    body;

  if (!title || price == null || !main_photo) {
    return NextResponse.json(
      { error: "title, price, and main_photo are required" },
      { status: 400 }
    );
  }

  const id = createItem({
    title,
    price: Number(price),
    dimensions,
    description,
    main_photo,
  });

  if (extra_photos && Array.isArray(extra_photos)) {
    extra_photos.forEach((photoPath: string, i: number) => {
      addItemPhoto(id, photoPath, i);
    });
  }

  return NextResponse.json({ id }, { status: 201 });
}
