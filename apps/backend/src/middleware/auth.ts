import type { Context, MiddlewareHandler } from "hono";
import { auth } from "../lib/auth";

type AuthSession = typeof auth.$Infer.Session;

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
