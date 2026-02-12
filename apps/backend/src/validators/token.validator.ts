import { z } from "zod";

export const purchaseVerifySchema = z.object({
  receiptData: z.string(),
  platform: z.enum(["ios", "android"]),
});
