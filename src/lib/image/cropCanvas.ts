import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getRadianAngle(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function rotatedBoxSize(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/** Renders the Cropper's pixel crop + rotation onto a canvas and exports
 * it as a blob — the one-time, client-side "bake it in" step that runs
 * only when the admin hits Save. Everything before that (drag, zoom,
 * rotate) is pure CSS transforms inside the Cropper, so it's instant; this
 * is the only part that touches pixels, and it still never leaves the
 * browser. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const { width: boxWidth, height: boxHeight } = rotatedBoxSize(image.width, image.height, rotation);

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = boxWidth;
  rotatedCanvas.height = boxHeight;
  const rotatedCtx = rotatedCanvas.getContext("2d");
  if (!rotatedCtx) throw new Error("Couldn't prepare that image");

  rotatedCtx.translate(boxWidth / 2, boxHeight / 2);
  rotatedCtx.rotate(getRadianAngle(rotation));
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = pixelCrop.width;
  outputCanvas.height = pixelCrop.height;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("Couldn't prepare that image");

  outputCtx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't export that image"))),
      "image/webp",
      0.92,
    );
  });
}
