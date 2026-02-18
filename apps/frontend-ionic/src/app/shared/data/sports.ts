export type SportKey =
  | "running"
  | "trail"
  | "triathlon"
  | "cycling"
  | "crossfit"
  | "swimming"
  | "hyrox";

export const SPORT_REGISTRY: Record<SportKey, { emoji: string; icon: string }> =
  {
    running: { emoji: "\u{1F3C3}", icon: "walk-outline" },
    trail: { emoji: "\u{26F0}\u{FE0F}", icon: "trail-sign-outline" },
    triathlon: { emoji: "\u{1F3CA}", icon: "bicycle-outline" },
    cycling: { emoji: "\u{1F6B4}", icon: "bicycle-outline" },
    crossfit: { emoji: "\u{1F3CB}\u{FE0F}", icon: "barbell-outline" },
    swimming: { emoji: "\u{1F3CA}", icon: "water-outline" },
    hyrox: { emoji: "\u{1F4AA}", icon: "flash-outline" },
  };

/** 13 user-facing sports (onboarding, profile, explore filters). */
export const USER_SPORTS: readonly SportKey[] = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "crossfit",
  "swimming",
  "hyrox",
] as const;

/** 7 sports matching the DB enum (trophy creation, race data). */
export const RACE_SPORTS: readonly SportKey[] = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "swimming",
] as const;

export function sportEmoji(key: string): string {
  return (
    (SPORT_REGISTRY as Record<string, { emoji: string }>)[key]?.emoji ?? ""
  );
}

export function sportIcon(key: string): string {
  return (
    (SPORT_REGISTRY as Record<string, { icon: string }>)[key]?.icon ??
    "ellipse-outline"
  );
}
