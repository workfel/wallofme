import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

const MAX_DIMENSION = 1024;

export async function removeImageBackground(
  imageBuffer: Buffer,
): Promise<Buffer> {
  try {
    // Downscale before remove-bg for faster processing
    const optimized = await sharp(imageBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const blob = new Blob([new Uint8Array(optimized)], { type: "image/jpeg" });
    const result = await removeBackground(blob);
    const arrayBuffer = await result.arrayBuffer();
    return sharp(Buffer.from(arrayBuffer)).webp({ quality: 90 }).toBuffer();
  } catch (error) {
    console.error("Error removing background:", error);
    return imageBuffer;
  }
}
