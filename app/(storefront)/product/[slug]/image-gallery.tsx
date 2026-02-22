"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  productName: string;
  productImages: string[];
  variantImages: string[] | null;
}

export function ImageGallery({
  productName,
  productImages,
  variantImages,
}: ImageGalleryProps) {
  // Use variant images when available, otherwise fallback to product images
  const images =
    variantImages && variantImages.length > 0 ? variantImages : productImages;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset to first image when the image set changes (variant selection)
  useEffect(() => {
    setSelectedIndex(0);
  }, [variantImages]);

  const mainImage = images[selectedIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/30">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br/oklch from-primary/10 via-secondary/20 to-accent/10">
            <span className="font-serif text-6xl font-semibold text-muted-foreground/20">
              {productName.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Row */}
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary/30 transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/50 cursor-pointer"
              )}
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="size-20 shrink-0 rounded-lg border border-border/50 bg-secondary/30"
            />
          ))}
        </div>
      )}
    </div>
  );
}
