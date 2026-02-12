import { z } from "zod";

export const themeQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
});
