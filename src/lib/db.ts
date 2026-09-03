import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "yard-sale.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        dimensions TEXT,
        description TEXT,
        main_photo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'reserved', 'purchased')),
        reserved_by TEXT,
        reserved_email TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS item_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        photo_path TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}

export type Item = {
  id: number;
  title: string;
  price: number;
  dimensions: string | null;
  description: string | null;
  main_photo: string;
  status: "available" | "reserved" | "purchased";
  reserved_by: string | null;
  reserved_email: string | null;
  created_at: string;
};

export type ItemPhoto = {
  id: number;
  item_id: number;
  photo_path: string;
  sort_order: number;
};

export function getAllItems(): Item[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM items ORDER BY
        CASE status
          WHEN 'available' THEN 0
          WHEN 'reserved' THEN 1
          WHEN 'purchased' THEN 2
        END,
        created_at DESC`
    )
    .all() as Item[];
}

export function getItem(id: number): Item | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM items WHERE id = ?").get(id) as
    | Item
    | undefined;
}

export function getItemPhotos(itemId: number): ItemPhoto[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM item_photos WHERE item_id = ? ORDER BY sort_order"
    )
    .all(itemId) as ItemPhoto[];
}

export function createItem(item: {
  title: string;
  price: number;
  dimensions?: string;
  description?: string;
  main_photo: string;
}): number {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO items (title, price, dimensions, description, main_photo) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      item.title,
      item.price,
      item.dimensions ?? null,
      item.description ?? null,
      item.main_photo
    );
  return result.lastInsertRowid as number;
}

export function addItemPhoto(
  itemId: number,
  photoPath: string,
  sortOrder: number
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO item_photos (item_id, photo_path, sort_order) VALUES (?, ?, ?)"
  ).run(itemId, photoPath, sortOrder);
}

export function updateItem(
  id: number,
  item: Partial<{
    title: string;
    price: number;
    dimensions: string;
    description: string;
    main_photo: string;
    status: string;
  }>
): void {
  const db = getDb();
  const fields = Object.entries(item)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`);
  const values = Object.entries(item)
    .filter(([, v]) => v !== undefined)
    .map(([, v]) => v);
  if (fields.length === 0) return;
  db.prepare(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
    id
  );
}

export function reserveItem(
  id: number,
  name: string,
  email: string
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE items SET status = 'reserved', reserved_by = ?, reserved_email = ? WHERE id = ? AND status = 'available'"
    )
    .run(name, email, id);
  return result.changes > 0;
}

export function deleteItem(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM items WHERE id = ?").run(id);
}

export function deleteItemPhoto(photoId: number): void {
  const db = getDb();
  db.prepare("DELETE FROM item_photos WHERE id = ?").run(photoId);
}

export type WaitlistEntry = {
  id: number;
  item_id: number;
  name: string;
  email: string | null;
  created_at: string;
};

export function getWaitlist(itemId: number): WaitlistEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM waitlist WHERE item_id = ? ORDER BY created_at")
    .all(itemId) as WaitlistEntry[];
}

export function addToWaitlist(
  itemId: number,
  name: string,
  email: string | null
): number {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO waitlist (item_id, name, email) VALUES (?, ?, ?)")
    .run(itemId, name, email || null);
  return result.lastInsertRowid as number;
}

export function removeFromWaitlist(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM waitlist WHERE id = ?").run(id);
}

export type Subscriber = {
  id: number;
  email: string;
  created_at: string;
};

export function addSubscriber(email: string): boolean {
  const db = getDb();
  try {
    db.prepare("INSERT INTO subscribers (email) VALUES (?)").run(email);
    return true;
  } catch {
    return false;
  }
}

export function getAllSubscribers(): Subscriber[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM subscribers ORDER BY created_at DESC")
    .all() as Subscriber[];
}

export function removeSubscriber(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM subscribers WHERE id = ?").run(id);
}

// --- "My stuff": a visitor's own reservations and waitlist entries, by email ---

export type MyReservation = {
  id: number;
  title: string;
  price: number;
  main_photo: string;
};

export type MyWaitlistEntry = {
  entry_id: number;
  item_id: number;
  title: string;
  price: number;
  main_photo: string;
};

export function getReservationsByEmail(email: string): MyReservation[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, title, price, main_photo FROM items
       WHERE status = 'reserved' AND lower(reserved_email) = ?
       ORDER BY title`
    )
    .all(email.trim().toLowerCase()) as MyReservation[];
}

export function getWaitlistByEmail(email: string): MyWaitlistEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT w.id AS entry_id, i.id AS item_id, i.title, i.price, i.main_photo
       FROM waitlist w JOIN items i ON w.item_id = i.id
       WHERE lower(w.email) = ?
       ORDER BY i.title`
    )
    .all(email.trim().toLowerCase()) as MyWaitlistEntry[];
}

// Cancel a reservation only if the email matches the one that reserved it.
export function cancelReservationByEmail(
  itemId: number,
  email: string
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE items
       SET status = 'available', reserved_by = NULL, reserved_email = NULL
       WHERE id = ? AND status = 'reserved' AND lower(reserved_email) = ?`
    )
    .run(itemId, email.trim().toLowerCase());
  return result.changes > 0;
}

// Remove a waitlist entry only if the email matches the one on the entry.
export function removeWaitlistByEmail(
  entryId: number,
  email: string
): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM waitlist WHERE id = ? AND lower(email) = ?")
    .run(entryId, email.trim().toLowerCase());
  return result.changes > 0;
}
