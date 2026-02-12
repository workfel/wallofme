import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

export const sportEnum = pgEnum("sport", [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "swimming",
  "obstacle",
  "other",
]);

export const trophyTypeEnum = pgEnum("trophy_type", ["medal", "bib"]);

export const trophyStatusEnum = pgEnum("trophy_status", [
  "pending",
  "processing",
  "ready",
  "error",
]);

export const resultSourceEnum = pgEnum("result_source", [
  "manual",
  "ai",
  "scraped",
]);

export const wallEnum = pgEnum("wall", ["left", "right"]);

export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", [
  "purchase",
  "rewarded_video",
  "spend_decoration",
  "spend_theme",
  "refund",
  "bonus",
]);

// ─── BetterAuth Tables ──────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  // Custom fields
  displayName: text("display_name"),
  isPro: boolean("is_pro").default(false).notNull(),
  locale: text("locale").default("en"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  country: text("country"),
  tokenBalance: integer("token_balance").default(0).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Domain Tables ──────────────────────────────────────

export const race = pgTable("race", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date"),
  location: text("location"),
  distance: text("distance"),
  sport: sportEnum("sport"),
  officialUrl: text("official_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const raceResult = pgTable("race_result", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  raceId: uuid("race_id")
    .notNull()
    .references(() => race.id, { onDelete: "cascade" }),
  time: text("time"),
  ranking: integer("ranking"),
  categoryRanking: integer("category_ranking"),
  totalParticipants: integer("total_participants"),
  source: resultSourceEnum("source").default("manual").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trophy = pgTable("trophy", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  raceResultId: uuid("race_result_id").references(() => raceResult.id, {
    onDelete: "set null",
  }),
  type: trophyTypeEnum("type").notNull(),
  originalImageUrl: text("original_image_url"),
  processedImageUrl: text("processed_image_url"),
  textureUrl: text("texture_url"),
  thumbnailUrl: text("thumbnail_url"),
  aiIdentifiedRace: text("ai_identified_race"),
  aiConfidence: real("ai_confidence"),
  status: trophyStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const room = pgTable("room", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  themeId: text("theme_id"),
  customTheme: text("custom_theme"),
  shareSlug: text("share_slug").unique(),
  floor: text("floor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const decoration = pgTable("decoration", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  modelUrl: text("model_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"),
  isPremium: boolean("is_premium").default(false).notNull(),
  priceTokens: integer("price_tokens").default(0).notNull(),
  defaultScale: real("default_scale").default(1).notNull(),
  wallMountable: boolean("wall_mountable").default(false).notNull(),
  floorOnly: boolean("floor_only").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomItem = pgTable("room_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => room.id, { onDelete: "cascade" }),
  trophyId: uuid("trophy_id").references(() => trophy.id, {
    onDelete: "set null",
  }),
  decorationId: uuid("decoration_id").references(() => decoration.id, {
    onDelete: "set null",
  }),
  positionX: real("position_x").default(0).notNull(),
  positionY: real("position_y").default(0).notNull(),
  positionZ: real("position_z").default(0).notNull(),
  rotationY: real("rotation_y").default(0).notNull(),
  scaleX: real("scale_x").default(1).notNull(),
  scaleY: real("scale_y").default(1).notNull(),
  scaleZ: real("scale_z").default(1).notNull(),
  wall: wallEnum("wall"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userDecoration = pgTable("user_decoration", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  decorationId: uuid("decoration_id")
    .notNull()
    .references(() => decoration.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// ─── Theme Tables ───────────────────────────────────────

export const theme = pgTable("theme", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  wallColor: text("wall_color"),
  floorColor: text("floor_color"),
  backgroundColor: text("background_color"),
  wallTexture: text("wall_texture"),
  floorTexture: text("floor_texture"),
  isFree: boolean("is_free").default(false).notNull(),
  priceTokens: integer("price_tokens").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userTheme = pgTable("user_theme", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  themeId: uuid("theme_id")
    .notNull()
    .references(() => theme.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// ─── Token Economy ──────────────────────────────────────

export const tokenTransaction = pgTable("token_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: tokenTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(),
  referenceId: text("reference_id"),
  referenceType: text("reference_type"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  raceResults: many(raceResult),
  trophies: many(trophy),
  room: one(room),
  userDecorations: many(userDecoration),
  userThemes: many(userTheme),
  tokenTransactions: many(tokenTransaction),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const raceRelations = relations(race, ({ many }) => ({
  results: many(raceResult),
}));

export const raceResultRelations = relations(raceResult, ({ one, many }) => ({
  user: one(user, { fields: [raceResult.userId], references: [user.id] }),
  race: one(race, { fields: [raceResult.raceId], references: [race.id] }),
  trophies: many(trophy),
}));

export const trophyRelations = relations(trophy, ({ one }) => ({
  user: one(user, { fields: [trophy.userId], references: [user.id] }),
  raceResult: one(raceResult, {
    fields: [trophy.raceResultId],
    references: [raceResult.id],
  }),
}));

export const roomRelations = relations(room, ({ one, many }) => ({
  user: one(user, { fields: [room.userId], references: [user.id] }),
  items: many(roomItem),
}));

export const roomItemRelations = relations(roomItem, ({ one }) => ({
  room: one(room, { fields: [roomItem.roomId], references: [room.id] }),
  trophy: one(trophy, {
    fields: [roomItem.trophyId],
    references: [trophy.id],
  }),
  decoration: one(decoration, {
    fields: [roomItem.decorationId],
    references: [decoration.id],
  }),
}));

export const decorationRelations = relations(decoration, ({ many }) => ({
  roomItems: many(roomItem),
  userDecorations: many(userDecoration),
}));

export const userDecorationRelations = relations(userDecoration, ({ one }) => ({
  user: one(user, {
    fields: [userDecoration.userId],
    references: [user.id],
  }),
  decoration: one(decoration, {
    fields: [userDecoration.decorationId],
    references: [decoration.id],
  }),
}));

export const themeRelations = relations(theme, ({ many }) => ({
  userThemes: many(userTheme),
}));

export const userThemeRelations = relations(userTheme, ({ one }) => ({
  user: one(user, { fields: [userTheme.userId], references: [user.id] }),
  theme: one(theme, { fields: [userTheme.themeId], references: [theme.id] }),
}));

export const tokenTransactionRelations = relations(tokenTransaction, ({ one }) => ({
  user: one(user, { fields: [tokenTransaction.userId], references: [user.id] }),
}));
