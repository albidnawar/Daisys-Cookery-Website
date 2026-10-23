/** Converts any fetched image blob to PNG via canvas — the Clipboard API
 * is reliably supported for image/png across browsers (Safari in
 * particular rejects other image mime types), so this normalizes
 * JPEG/WebP source photos before writing them to the clipboard. */
async function toPngBlob(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported in this browser.");
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't convert the image."))),
      "image/png",
    );
  });
}

/** Copies a cake photo to the system clipboard so a customer can paste it
 * straight into a Facebook Messenger chat (the m.me deep link the site's
 * chat widget uses can't carry an image itself — Messenger only supports
 * prefilled text via its `ref` param). */
export async function copyImageToClipboard(url: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Image copying isn't supported in this browser.");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Couldn't load the image.");
  const sourceBlob = await res.blob();
  const pngBlob = await toPngBlob(sourceBlob);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
}
