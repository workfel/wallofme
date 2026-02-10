import { z } from "zod";

export const onboardingSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  country: z.string().length(2).optional(),
});
