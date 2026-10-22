"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Button } from "@/components/ui/Button";
import { getCroppedImageBlob } from "@/lib/image/cropCanvas";

/** Zoom/rotate/reposition a photo already on the server, then re-upload the
 * result as a new file — same "bake it into the stored image" approach the
 * old 90°-rotate-via-server-roundtrip button used, but every adjustment
 * here is a CSS transform inside Cropper (instant) instead of a
 * download/re-encode/re-upload round trip per click. The network only gets
 * touched once, when the admin hits Save. */
export function ImageAdjusterModal({
  src,
  aspect = 4 / 3,
  onCancel,
  onSave,
}: {
  src: string;
  aspect?: number;
  onCancel: () => void;
  onSave: (newUrl: string) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const save = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(src, croppedAreaPixels, rotation);
      const form = new FormData();
      form.set("file", new File([blob], "adjusted.webp", { type: "image/webp" }));
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onSave(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that image");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-semibold text-brand-chocolate">Adjust photo</p>

        <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-cream">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            zoomSpeed={1.5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Rotation
          </span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          />
        </label>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={save} disabled={saving || !croppedAreaPixels}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
