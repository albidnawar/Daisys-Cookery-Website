"use client";

import { useRef, useState } from "react";

function UploadSlot({
  draftId,
  onUploaded,
  onError,
}: {
  draftId: string | null;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!draftId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/draft-order/${draftId}/reference-image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const urls: string[] = data.draft.spec.referenceImageUrls ?? [];
      onUploaded(urls[urls.length - 1]);
    } catch {
      onError("Couldn't upload that image — try a PNG, JPEG, or WebP under 8MB.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-chocolate/25 bg-cream text-center"
    >
      <span className="px-4 font-body text-sm text-brand-chocolate/60">
        {uploading ? "Uploading…" : "Drop a reference photo, or click to browse"}
      </span>
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
    </button>
  );
}

export function ReferenceImageDropzone({
  draftId,
  imageUrls,
  maxImages = 3,
  instructions,
  onChange,
  onInstructionsChange,
}: {
  draftId: string | null;
  imageUrls: string[];
  maxImages?: number;
  instructions: string | undefined;
  onChange: (urls: string[]) => void;
  onInstructionsChange: (value: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imageUrls.map((url, i) => (
          <div key={url} className="relative aspect-4/3 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Reference" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(imageUrls.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 font-body text-sm font-bold text-red-600"
            >
              ×
            </button>
          </div>
        ))}
        {imageUrls.length < maxImages && (
          <UploadSlot
            draftId={draftId}
            onUploaded={(url) => {
              setError(null);
              onChange([...imageUrls, url]);
            }}
            onError={setError}
          />
        )}
      </div>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
      <textarea
        value={instructions ?? ""}
        onChange={(e) => onInstructionsChange(e.target.value)}
        placeholder="Tell us what to change — e.g. write 'Happy Anniversary' on the board, add fresh flowers on top…"
        rows={3}
        className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
      />
    </div>
  );
}
