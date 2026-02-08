import { hc } from "hono/client";
import type { AppType } from "../../backend/src/index";

export const api = hc<AppType>(process.env.EXPO_PUBLIC_API_URL!);
