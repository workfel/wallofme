import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { encryptionMiddleware } from "./middleware/encryption";
import { trophies } from "./routes/trophies.routes";
import { races } from "./routes/races.routes";
import { rooms } from "./routes/rooms.routes";
import { decorations } from "./routes/decorations.routes";
import { upload } from "./routes/upload.routes";
import { scan } from "./routes/scan.routes";
import { users } from "./routes/users.routes";
import { tokens } from "./routes/tokens.routes";
import { themes } from "./routes/themes.routes";
import { webhooks } from "./routes/webhooks.routes";
import { social } from "./routes/social.routes";

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
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "User-Agent",
      "x-skip-oauth-proxy",
      "capacitor-origin",
    ],
    allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["set-auth-token", "X-Encrypted"],
  }),
);

// Payload encryption middleware (toggle via ENCRYPT_PAYLOADS env var)
app.use("*", encryptionMiddleware);

// Session middleware — populates user/session on every request (non-blocking)
app.use("*", sessionMiddleware);

// BetterAuth handler — Hono's c.res setter auto-merges CORS headers from middleware
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
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
  .route("/api/users", users)
  .route("/api/tokens", tokens)
  .route("/api/themes", themes)
  .route("/api/webhooks", webhooks)
  .route("/api/social", social);

export type AppType = typeof route;

export default {
  port: process.env.PORT || 3333,
  fetch: app.fetch,
};
