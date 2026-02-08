import sharp from "sharp";

export async function processTextureImage(
  input: Buffer
): Promise<Buffer> {
  return sharp(input)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

export async function generateThumbnail(
  input: Buffer
): Promise<Buffer> {
  return sharp(input)
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();
}
