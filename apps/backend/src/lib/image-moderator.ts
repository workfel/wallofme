import { generateText, Output } from "ai";
import { z } from "zod";
import { getVisionModel } from "./ai-analyzer";

const moderationSchema = z.object({
  isNSFW: z.boolean().describe("Whether the image contains NSFW content"),
  reason: z
    .string()
    .nullable()
    .describe("Reason for flagging, null if safe"),
});

export async function moderateImage(
  imageUrl: string,
): Promise<{ safe: boolean; reason: string | null }> {
  try {
    const { output } = await generateText({
      model: getVisionModel(),
      maxRetries: 1,
      output: Output.object({ schema: moderationSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: new URL(imageUrl),
            },
            {
              type: "text",
              text: `Analyze this image for content moderation.

Check if the image contains any of the following:
- Nudity or sexual content
- Graphic violence or gore
- Hate symbols or extremist content
- Drug use or illegal activities

Return isNSFW: true if ANY of the above is detected, with a brief reason.
Return isNSFW: false and reason: null if the image is safe.`,
            },
          ],
        },
      ],
    });

    if (output) {
      return { safe: !output.isNSFW, reason: output.reason };
    }

    // If parsing fails, allow the image through (fail open)
    return { safe: true, reason: null };
  } catch {
    // On error, allow through to not block the user
    return { safe: true, reason: null };
  }
}
