"use client";

import { useRef, useState } from "react";

export function ReferenceImageDropzone({
  draftId,
  imageUrl,
  instructions,
  onUploaded,
  onInstructionsChange,
}: {
  draftId: string | null;
  imageUrl: string | null | undefined;
  instructions: string | undefined;
  onUploaded: (url: string) => void;
  onInstructionsChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (!draftId) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/draft-order/${draftId}/reference-image`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { draft } = await res.json();
      onUploaded(draft.spec.referenceImageUrl);
    } catch {
      setError("Couldn't upload that image — try a PNG, JPEG, or WebP under 8MB.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Reference cake" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 font-body text-sm text-brand-chocolate/60">
            {uploading ? "Uploading…" : "Drop a photo of a cake from our gallery, or click to browse"}
          </span>
        )}
      </button>
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
