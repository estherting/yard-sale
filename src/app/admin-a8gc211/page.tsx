"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Item = {
  id: number;
  title: string;
  price: number;
  dimensions: string | null;
  description: string | null;
  main_photo: string;
  status: string;
  reserved_by: string | null;
  reserved_email: string | null;
  photos?: { id: number; photo_path: string }[];
};

type WaitlistEntry = {
  id: number;
  item_id: number;
  name: string;
  email: string | null;
  created_at: string;
};

type Subscriber = {
  id: number;
  email: string;
  created_at: string;
};

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [waitlists, setWaitlists] = useState<Record<number, WaitlistEntry[]>>({});
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [description, setDescription] = useState("");
  const [mainPhotoFile, setMainPhotoFile] = useState<File | null>(null);
  const [mainPhotoPreview, setMainPhotoPreview] = useState("");
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
    loadSubscribers();
  }, []);

  async function loadItems() {
    const res = await fetch("/api/items");
    const data: Item[] = await res.json();
    setItems(data);

    const wl: Record<number, WaitlistEntry[]> = {};
    await Promise.all(
      data
        .filter((item) => item.status === "reserved")
        .map(async (item) => {
          const res = await fetch(`/api/items/${item.id}/waitlist`);
          wl[item.id] = await res.json();
        })
    );
    setWaitlists(wl);
  }

  async function loadSubscribers() {
    const res = await fetch("/api/admin/subscribers");
    setSubscribers(await res.json());
  }

  async function handleRemoveFromWaitlist(itemId: number, entryId: number) {
    await fetch(`/api/items/${itemId}/waitlist?entryId=${entryId}`, {
      method: "DELETE",
    });
    await loadItems();
  }

  async function handleRemoveSubscriber(id: number) {
    await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
    await loadSubscribers();
  }

  function resetForm() {
    setTitle("");
    setPrice("");
    setDimensions("");
    setDescription("");
    setMainPhotoFile(null);
    setMainPhotoPreview("");
    setExtraPhotoFiles([]);
    setEditingItem(null);
    setShowForm(false);
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let mainPhotoPath = editingItem?.main_photo || "";

    if (mainPhotoFile) {
      mainPhotoPath = await uploadFile(mainPhotoFile);
    }

    const extraPhotoPaths: string[] = [];
    for (const file of extraPhotoFiles) {
      extraPhotoPaths.push(await uploadFile(file));
    }

    if (editingItem) {
      await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: Number(price),
          dimensions: dimensions || null,
          description: description || null,
          ...(mainPhotoFile ? { main_photo: mainPhotoPath } : {}),
          extra_photos: extraPhotoPaths.length > 0 ? extraPhotoPaths : undefined,
        }),
      });
    } else {
      if (!mainPhotoPath) {
        setSubmitting(false);
        return;
      }
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: Number(price),
          dimensions: dimensions || null,
          description: description || null,
          main_photo: mainPhotoPath,
          extra_photos: extraPhotoPaths,
        }),
      });
    }

    resetForm();
    await loadItems();
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await loadItems();
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadItems();
  }

  function startEdit(item: Item) {
    setEditingItem(item);
    setTitle(item.title);
    setPrice(String(item.price));
    setDimensions(item.dimensions || "");
    setDescription(item.description || "");
    setMainPhotoPreview(item.main_photo);
    setMainPhotoFile(null);
    setExtraPhotoFiles([]);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? "Edit Item" : "New Item"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder='e.g. 12" x 8" x 4"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Photo {editingItem ? "" : "*"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setMainPhotoFile(file);
                  if (file) {
                    setMainPhotoPreview(URL.createObjectURL(file));
                  }
                }}
                required={!editingItem}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {mainPhotoPreview && (
                <img
                  src={mainPhotoPreview}
                  alt="Preview"
                  className="mt-2 w-24 h-24 object-cover rounded-md"
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setExtraPhotoFiles(Array.from(e.target.files || []))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : editingItem
                ? "Update Item"
                : "Create Item"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-4">
              <img
                src={item.main_photo}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <Link href={`/items/${item.id}`} className="font-semibold hover:underline">
                  {item.title}
                </Link>
                <p className="text-sm text-gray-500">
                  ${item.price.toFixed(2)}
                  {item.reserved_by && ` — Reserved by ${item.reserved_by}${item.reserved_email ? ` (${item.reserved_email})` : ""}`}
                </p>
              </div>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="purchased">Purchased</option>
              </select>
              <button
                onClick={() => startEdit(item)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
            {waitlists[item.id] && waitlists[item.id].length > 0 && (
              <div className="border-t border-gray-100 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                  Waitlist ({waitlists[item.id].length})
                </p>
                <ul className="space-y-1">
                  {waitlists[item.id].map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {entry.name}
                        {entry.email && (
                          <span className="text-gray-400"> ({entry.email})</span>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemoveFromWaitlist(item.id, entry.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No items yet. Click &quot;Add Item&quot; to get started.
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">
          Subscribers ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-gray-500 text-sm">No subscribers yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm">{sub.email}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(sub.created_at + "Z").toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveSubscriber(sub.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
