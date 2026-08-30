import { NextRequest, NextResponse } from "next/server";
import {
  getItem,
  getItemPhotos,
  updateItem,
  deleteItem,
  addItemPhoto,
  deleteItemPhoto,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = getItem(Number(id));
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const photos = getItemPhotos(item.id);
  return NextResponse.json({ ...item, photos });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { extra_photos, delete_photos, ...fields } = body;

  updateItem(Number(id), fields);

  if (delete_photos && Array.isArray(delete_photos)) {
    delete_photos.forEach((photoId: number) => deleteItemPhoto(photoId));
  }

  if (extra_photos && Array.isArray(extra_photos)) {
    const existing = getItemPhotos(Number(id));
    const maxOrder = existing.length > 0 ? Math.max(...existing.map((p) => p.sort_order)) + 1 : 0;
    extra_photos.forEach((photoPath: string, i: number) => {
      addItemPhoto(Number(id), photoPath, maxOrder + i);
    });
  }

  const updated = getItem(Number(id));
  const photos = getItemPhotos(Number(id));
  return NextResponse.json({ ...updated, photos });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteItem(Number(id));
  return NextResponse.json({ success: true });
}
