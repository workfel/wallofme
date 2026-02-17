import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import { capacitor } from "better-auth-capacitor";
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
      tokenBalance: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      sports: {
        type: "string",
        required: false,
        input: false,
      },
      proExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
      referralCode: {
        type: "string",
        required: false,
        input: false,
      },
      referredBy: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    capacitor({
      disableOriginOverride: false,
    }),
    bearer(),
  ],
  trustedOrigins: [
    "wallofme://",
    "wallofme://*",
    "capacitor://localhost",
    "http://localhost",
    // Production
    "https://wallofme.workfel.cloud",
    "https://api-wallofme.workfel.cloud",
    ...(process.env.NODE_ENV !== "production"
      ? [
          "exp://",
          "exp://**",
          "exp://192.168.*.*:*/**",
          "http://localhost:8081",
          "http://localhost:8100",
          "http://localhost:8101",
          "http://localhost:8102",
          "http://192.168.1.11:8100",
          "http://192.168.1.11:8101",
          "http://192.168.1.11:8102",
        ]
      : []),
  ],
});
