"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ItemDetail = {
  id: number;
  title: string;
  price: number;
  dimensions: string | null;
  description: string | null;
  main_photo: string;
  status: "available" | "reserved" | "purchased";
  reserved_by: string | null;
  photos: { id: number; photo_path: string }[];
};

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

export default function ItemDetail() {
  const params = useParams();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setSelectedPhoto(data.main_photo);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <p className="text-center py-16 text-gray-500">Loading...</p>;
  }

  if (!item) {
    return <p className="text-center py-16 text-gray-500">Item not found.</p>;
  }

  const allPhotos = [
    item.main_photo,
    ...item.photos.map((p) => p.photo_path),
  ];

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; Back to listings
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div>
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={selectedPhoto}
                alt={item.title}
                className="w-full h-full object-contain"
              />
              <span
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[item.status]}`}
              >
                {statusLabels[item.status]}
              </span>
            </div>
            {allPhotos.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {allPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                      selectedPhoto === photo
                        ? "border-green-600"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${item.title} photo ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">{item.title}</h1>
            <p className="text-3xl font-bold">${item.price.toFixed(2)}</p>

            {item.dimensions && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Dimensions
                </h3>
                <p className="mt-1">{item.dimensions}</p>
              </div>
            )}

            {item.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </h3>
                <p className="mt-1 whitespace-pre-line">{item.description}</p>
              </div>
            )}

            {item.status === "available" ? (
              <Link
                href={`/items/${item.id}/reserve`}
                className="mt-auto block text-center bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Reserve This Item
              </Link>
            ) : item.status === "reserved" ? (
              <div className="mt-auto">
                <Link
                  href={`/items/${item.id}/waitlist`}
                  className="w-full block text-center bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  Join Waitlist
                </Link>
              </div>
            ) : (
              <div className="mt-auto">
                <button
                  disabled
                  className="w-full block text-center bg-gray-200 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  Purchased
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
