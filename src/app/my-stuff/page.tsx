"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCachedUser, setCachedUser } from "@/lib/user-cache";

type Reservation = {
  id: number;
  title: string;
  price: number;
  main_photo: string;
};

type WaitlistItem = {
  entry_id: number;
  item_id: number;
  title: string;
  price: number;
  main_photo: string;
};

export default function MyStuffPage() {
  const [email, setEmail] = useState("");
  const [viewedEmail, setViewedEmail] = useState<string | null>(null);
  const [reserved, setReserved] = useState<Reservation[]>([]);
  const [waitlisted, setWaitlisted] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = getCachedUser();
    if (cached.email) setEmail(cached.email);
  }, []);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/my-stuff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const data = await res.json();
      setReserved(data.reserved);
      setWaitlisted(data.waitlisted);
      setViewedEmail(email);
      setCachedUser({ email });
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
    setLoading(false);
  }

  async function removeReservation(itemId: number) {
    if (!confirm("Remove this reservation? The item will become available again.")) return;
    const res = await fetch("/api/my-stuff/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, email: viewedEmail }),
    });
    if (res.ok) {
      setReserved((prev) => prev.filter((r) => r.id !== itemId));
    }
  }

  async function removeWaitlist(entryId: number) {
    if (!confirm("Remove yourself from this waitlist?")) return;
    const res = await fetch("/api/my-stuff/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId, email: viewedEmail }),
    });
    if (res.ok) {
      setWaitlisted((prev) => prev.filter((w) => w.entry_id !== entryId));
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; Back to listings
      </Link>

      <h1 className="text-3xl font-bold mb-6">My Stuff</h1>

      {viewedEmail === null ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            Enter your email to see the items you&apos;ve reserved and waitlisted.
          </p>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Loading..." : "View My Stuff"}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Showing items for <strong>{viewedEmail}</strong>.{" "}
            <button
              onClick={() => {
                setViewedEmail(null);
                setReserved([]);
                setWaitlisted([]);
              }}
              className="text-green-600 hover:underline"
            >
              Use a different email
            </button>
          </p>

          {reserved.length === 0 && waitlisted.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              You haven&apos;t reserved or waitlisted anything with this email.
            </p>
          ) : (
            <div className="space-y-8">
              {reserved.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Reserved</h2>
                  <div className="space-y-3">
                    {reserved.map((item) => (
                      <ItemRow
                        key={`r-${item.id}`}
                        title={item.title}
                        price={item.price}
                        photo={item.main_photo}
                        itemId={item.id}
                        onRemove={() => removeReservation(item.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {waitlisted.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Waitlisted</h2>
                  <div className="space-y-3">
                    {waitlisted.map((item) => (
                      <ItemRow
                        key={`w-${item.entry_id}`}
                        title={item.title}
                        price={item.price}
                        photo={item.main_photo}
                        itemId={item.item_id}
                        onRemove={() => removeWaitlist(item.entry_id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  title,
  price,
  photo,
  itemId,
  onRemove,
}: {
  title: string;
  price: number;
  photo: string;
  itemId: number;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
      <Link href={`/items/${itemId}`} className="shrink-0">
        <img
          src={photo}
          alt={title}
          className="w-16 h-16 object-cover rounded-md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/items/${itemId}`} className="font-semibold hover:underline">
          {title}
        </Link>
        <p className="text-sm text-gray-500">${price.toFixed(2)}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-sm text-red-600 hover:underline shrink-0"
      >
        Remove
      </button>
    </div>
  );
}
