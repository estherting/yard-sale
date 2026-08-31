import { getAllItems } from "@/lib/db";
import Link from "next/link";
import SubscribeForm from "./subscribe-form";

const statusStyles = {
  available: "bg-green-600 text-white",
  reserved: "bg-amber-500 text-white",
  purchased: "bg-gray-400 text-white",
} as const;

const statusLabels = {
  available: "Available",
  reserved: "Reserved",
  purchased: "Purchased",
} as const;

export const dynamic = "force-dynamic";

export default function Home() {
  const items = getAllItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Items for Sale</h1>
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          No items listed yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <Link href={`/items/${item.id}`} className="block relative">
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={item.main_photo}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[item.status]}`}
                  >
                    {statusLabels[item.status]}
                  </span>
                </div>
              </Link>
              <div className="p-4 flex flex-col gap-2">
                <Link href={`/items/${item.id}`} className="hover:underline">
                  <h2 className="font-semibold text-lg">{item.title}</h2>
                </Link>
                <p className="text-xl font-bold">${item.price.toFixed(2)}</p>
                {item.status === "available" ? (
                  <Link
                    href={`/items/${item.id}/reserve`}
                    className="mt-2 block text-center bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Reserve
                  </Link>
                ) : item.status === "reserved" ? (
                  <Link
                    href={`/items/${item.id}/waitlist`}
                    className="mt-2 block text-center bg-amber-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Join Waitlist
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-2 block text-center bg-gray-200 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    Purchased
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <SubscribeForm />
    </div>
  );
}
