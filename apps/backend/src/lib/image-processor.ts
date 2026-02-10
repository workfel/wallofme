import sharp from "sharp";
import { nanoid } from "nanoid";
import { removeImageBackground } from "./background-remover";
import { uploadBuffer, getPublicUrl } from "./storage";

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

export async function processTrophyImage(
  imageBuffer: Buffer,
  userId: string
): Promise<{
  processedImageUrl: string;
  textureUrl: string;
  thumbnailUrl: string;
}> {
  const id = nanoid();
  const prefix = `trophy-processed/${userId}`;

  // 1. Remove background
  const noBgBuffer = await removeImageBackground(imageBuffer);

  // 2. Generate texture (1024x1024)
  const textureBuffer = await processTextureImage(noBgBuffer);

  // 3. Generate thumbnail (256x256)
  const thumbnailBuffer = await generateThumbnail(noBgBuffer);

  // 4. Upload all three to R2
  const processedKey = `${prefix}/${id}.webp`;
  const textureKey = `${prefix}/${id}-texture.webp`;
  const thumbnailKey = `${prefix}/${id}-thumb.webp`;

  await Promise.all([
    uploadBuffer(noBgBuffer, processedKey, "image/webp"),
    uploadBuffer(textureBuffer, textureKey, "image/webp"),
    uploadBuffer(thumbnailBuffer, thumbnailKey, "image/webp"),
  ]);

  return {
    processedImageUrl: getPublicUrl(processedKey),
    textureUrl: getPublicUrl(textureKey),
    thumbnailUrl: getPublicUrl(thumbnailKey),
  };
}
