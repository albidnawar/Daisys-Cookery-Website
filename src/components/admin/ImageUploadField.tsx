"use client";

import { useRef, useState } from "react";
import { FocalPointPicker } from "@/components/admin/FocalPointPicker";
import { ImageAdjusterModal } from "@/components/admin/ImageAdjusterModal";
import type { FocalPoint } from "@/lib/image/focal";

export function ImageUploadField({
  label,
  value,
  onChange,
  focal,
  onFocalChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  /** When provided alongside `onFocalChange`, a drag-to-reposition focal
   * point picker replaces the plain preview once an image is uploaded. */
  focal?: FocalPoint | null;
  onFocalChange?: (point: FocalPoint) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
      }}
    />
  );

  if (value && onFocalChange) {
    return (
      <div>
        <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          {label}
        </span>
        <FocalPointPicker src={value} value={focal} onChange={onFocalChange} onAdjust={onChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 font-body text-xs font-bold text-brand-orange hover:text-brand-chocolate"
        >
          {uploading ? "Uploading…" : "Replace photo"}
        </button>
        {fileInput}
        {error && <p className="mt-1 font-body text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        {label}
      </span>
      <div className="relative w-full max-w-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-chocolate/25 bg-cream text-center"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="px-4 font-body text-sm text-brand-chocolate/60">
              {uploading ? "Uploading…" : "Click to upload"}
            </span>
          )}
        </button>
        {value && (
          <div className="absolute right-2 top-2">
            <button
              type="button"
              onClick={() => setAdjusting(true)}
              title="Zoom, rotate, or crop"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-chocolate shadow-md hover:bg-white"
            >
              ⤢
            </button>
          </div>
        )}
      </div>
      {fileInput}
      {error && <p className="mt-1 font-body text-xs text-red-600">{error}</p>}
      {adjusting && value && (
        <ImageAdjusterModal
          src={value}
          onCancel={() => setAdjusting(false)}
          onSave={(newUrl) => {
            onChange(newUrl);
            setAdjusting(false);
          }}
        />
      )}
    </div>
  );
}
