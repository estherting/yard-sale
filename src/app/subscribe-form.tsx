"use client";

import { useState } from "react";
import { setCachedUser } from "@/lib/user-cache";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) {
      setCachedUser({ email });
      setEmail("");
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-8 text-center">
      <p className="text-lg font-medium text-gray-700 mb-3">
        Get notified for new items!
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-center gap-2 max-w-md mx-auto"
      >
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
          disabled={submitting}
          className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? "..." : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
}
