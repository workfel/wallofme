import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
      },
      isPro: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      country: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [expo()],
  trustedOrigins: [
    "wallofme://",
    "wallofme://*",
    ...(process.env.NODE_ENV !== "production"
      ? [
          "exp://",
          "exp://**",
          "exp://192.168.*.*:*/**",
          "http://localhost:8081",
        ]
      : []),
  ],
});
