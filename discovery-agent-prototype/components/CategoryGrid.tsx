"use client";

import Image from "next/image";
import Link from "next/link";
import { getTopLevelCategories } from "@/lib/catalog";
import { useDevice } from "@/lib/device-context";
import { useSearch } from "@/lib/search-context";

type CategoryGridProps = {
  activeId?: string | null;
};

/** Blinkit-style category rail — photo tiles, not emoji. */
export function CategoryGrid({ activeId }: CategoryGridProps) {
  const { isMobile } = useDevice();
  const { clearQuery } = useSearch();
  const categories = getTopLevelCategories();

  return (
    <section className={isMobile ? "px-0 py-2" : "px-0 py-3"}>
      <h2 className="mb-3 text-lg font-extrabold text-blinkit-charcoal">
        Shop by category
      </h2>
      <div
        className={
          isMobile
            ? "grid grid-cols-4 gap-x-2 gap-y-4"
            : "grid grid-cols-6 gap-x-4 gap-y-5 lg:grid-cols-8"
        }
      >
        {categories.map((cat) => {
          const active = activeId === cat.id;
          const photo =
            cat.image ??
            (cat.l0 ? `/catalog/categories/${cat.l0}.jpg` : undefined);
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              onClick={() => clearQuery()}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <div
                className={`relative flex items-center justify-center overflow-hidden rounded-2xl transition-transform group-hover:scale-[1.03] ${
                  isMobile ? "h-[78px] w-full" : "h-[96px] w-full"
                } ${active ? "ring-2 ring-blinkit-green" : ""}`}
                style={{ backgroundColor: cat.imageTint || "#F6F6F6" }}
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={isMobile ? "80px" : "120px"}
                    unoptimized
                  />
                ) : (
                  <span
                    className={isMobile ? "text-3xl" : "text-4xl"}
                    aria-hidden
                  >
                    {cat.emoji}
                  </span>
                )}
              </div>
              <span
                className={`font-medium leading-tight text-blinkit-charcoal ${
                  isMobile ? "text-[11px]" : "text-xs"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
