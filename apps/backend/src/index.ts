import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { trophies } from "./routes/trophies.routes";
import { races } from "./routes/races.routes";
import { rooms } from "./routes/rooms.routes";
import { decorations } from "./routes/decorations.routes";
import { upload } from "./routes/upload.routes";
import { scan } from "./routes/scan.routes";
import { users } from "./routes/users.routes";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>();

// Global error handler
app.onError(errorHandler);

// CORS
app.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);

// Session middleware — populates user/session on every request (non-blocking)
app.use("*", sessionMiddleware);

// BetterAuth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Health check
app.get("/", (c) => c.json({ status: "ok" }));

// API routes — chained for RPC type inference
const route = app
  .route("/api/trophies", trophies)
  .route("/api/races", races)
  .route("/api/rooms", rooms)
  .route("/api/decorations", decorations)
  .route("/api/upload", upload)
  .route("/api/scan", scan)
  .route("/api/users", users);

export type AppType = typeof route;

export default {
  port: process.env.PORT || 3333,
  fetch: app.fetch,
};
