/** Client-side helper for the rotate button on admin image uploads — see
 * src/app/api/admin/upload/rotate/route.ts. Rotation is baked into the
 * stored file itself (not a CSS transform), so every place the image
 * later renders (next/image, plain <img>, kanban thumbnails, etc.) just
 * shows the corrected orientation with no extra handling. */
export async function rotateImage(url: string, degrees: 90 | -90): Promise<string> {
  const res = await fetch("/api/admin/upload/rotate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, degrees }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Couldn't rotate that image");
  return data.url as string;
}
