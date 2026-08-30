"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function WaitlistPage() {
  const params = useParams();
  const [item, setItem] = useState<{ id: number; title: string; price: number; main_photo: string; status: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((res) => res.json())
      .then(setItem);
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/items/${params.id}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || null }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
    setSubmitting(false);
  }

  if (!item) {
    return <p className="text-center py-16 text-gray-500">Loading...</p>;
  }

  if (item.status !== "reserved") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">This item is not currently reserved, so no waitlist is needed.</p>
        <Link href={`/items/${item.id}`} className="text-green-600 hover:underline">
          View item
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">You&apos;re on the waitlist!</h2>
          <p className="text-amber-700 mb-4">
            If <strong>{item.title}</strong> becomes available again, the seller will reach out to you.
          </p>
          <Link href="/" className="text-amber-600 hover:underline">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href={`/items/${item.id}`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; Back to item
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <img
            src={item.main_photo}
            alt={item.title}
            className="w-20 h-20 object-cover rounded-md"
          />
          <div>
            <h2 className="font-semibold text-lg">{item.title}</h2>
            <p className="text-xl font-bold">${item.price.toFixed(2)}</p>
            <p className="text-sm text-amber-600">Currently reserved</p>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-4">Join Waitlist</h1>
        <p className="text-sm text-gray-500 mb-4">
          You&apos;ll be notified if this item becomes available again.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Your Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Joining..." : "Join Waitlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
