CREATE TYPE "public"."token_transaction_type" AS ENUM('purchase', 'rewarded_video', 'spend_decoration', 'spend_theme', 'refund', 'bonus');--> statement-breakpoint
CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"preview_url" text,
	"wall_color" text,
	"floor_color" text,
	"background_color" text,
	"wall_texture" text,
	"floor_texture" text,
	"is_free" boolean DEFAULT false NOT NULL,
	"price_tokens" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "theme_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "token_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "token_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"theme_id" uuid NOT NULL,
	"acquired_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "theme_id" SET DATA TYPE uuid USING "theme_id"::uuid;--> statement-breakpoint
ALTER TABLE "decoration" ADD COLUMN "default_scale" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "decoration" ADD COLUMN "wall_mountable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decoration" ADD COLUMN "floor_only" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ADD COLUMN "share_slug" text;--> statement-breakpoint
ALTER TABLE "room_item" ADD COLUMN "scale_x" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "room_item" ADD COLUMN "scale_y" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "room_item" ADD COLUMN "scale_z" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "token_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "token_transaction" ADD CONSTRAINT "token_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_theme" ADD CONSTRAINT "user_theme_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_theme" ADD CONSTRAINT "user_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_share_slug_unique" UNIQUE("share_slug");