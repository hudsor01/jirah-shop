"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { createClient } from "@/lib/supabase/client";

type ImageUploadProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const uploadProps = useSupabaseUpload({
    bucketName: "product-images",
    path: "products",
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    maxFiles: 10,
  });

  const { isSuccess, successes } = uploadProps;

  useEffect(() => {
    if (!isSuccess) return;

    const supabase = createClient();
    const newUrls = successes.map(
      (fileName) =>
        supabase.storage
          .from("product-images")
          .getPublicUrl(`products/${fileName}`).data.publicUrl
    );

    const merged = Array.from(new Set([...images, ...newUrls]));
    onChange(merged);
  }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = (url: string) => {
    onChange(images.filter((img) => img !== url));
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone {...uploadProps}>
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>

      {images.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
          {images.map((url) => (
            <div key={url} className="relative group w-20 h-20">
              <img
                src={url}
                alt="Product image"
                className="w-full h-full object-cover rounded border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-0.5 right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
