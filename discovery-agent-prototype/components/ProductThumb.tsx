"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/products";

type ProductThumbProps = {
  product: Product;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const box = {
  sm: "h-14 w-14",
  md: "h-28 w-full",
  lg: "h-32 w-full",
};

const sizesAttr = {
  sm: "56px",
  md: "180px",
  lg: "220px",
};

/** Blinkit-style: white tile, pack photo contained (never cover-crop). */
export function ProductThumb({
  product,
  size = "md",
  className = "",
  priority = false,
}: ProductThumbProps) {
  const [failed, setFailed] = useState(false);
  const src = product.image;
  const showImage = Boolean(src) && !failed;
  const isPhoto =
    typeof src === "string" &&
    (src.endsWith(".jpg") ||
      src.endsWith(".jpeg") ||
      src.endsWith(".png") ||
      src.endsWith(".webp") ||
      src.includes("images.unsplash.com"));
  const isLocal = typeof src === "string" && src.startsWith("/");

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white ${box[size]} ${className}`}
    >
      {showImage && isPhoto ? (
        <Image
          src={src!}
          alt={product.name}
          fill
          className="object-contain p-1.5"
          sizes={sizesAttr[size]}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          unoptimized={isLocal}
          onError={() => setFailed(true)}
        />
      ) : showImage ? (
        // Fallback local SVG pack — still contain on white
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={product.name}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-3xl" aria-hidden>
          {product.emoji}
        </span>
      )}
    </div>
  );
}
