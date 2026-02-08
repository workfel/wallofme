import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.path}:`, err);

  if (err instanceof Error && err.message === "Unauthorized") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(
    {
      error: "Internal Server Error",
      ...(process.env.NODE_ENV !== "production" && {
        message: err.message,
      }),
    },
    500
  );
};
