import { db } from "../db";
import { notification, deviceToken, user } from "../db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

let firebaseApp: import("firebase-admin").app.App | null = null;

async function getFirebaseAdmin(): Promise<typeof import("firebase-admin") | null> {
  if (firebaseApp) {
    const admin = await import("firebase-admin");
    return admin;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    console.warn(
      "[notification-service] FIREBASE_SERVICE_ACCOUNT_JSON not set, push notifications disabled",
    );
    return null;
  }

  try {
    const admin = await import("firebase-admin");
    const serviceAccount = JSON.parse(json);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin;
  } catch (err) {
    console.error("[notification-service] Failed to initialize Firebase:", err);
    return null;
  }
}

export async function sendLikeNotification(
  roomOwnerId: string,
  roomId: string,
  likerName: string,
): Promise<void> {
  try {
    const admin = await getFirebaseAdmin();
    if (!admin) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for existing room_liked notification in the last hour
    const recentNotification = await db.query.notification.findFirst({
      where: and(
        eq(notification.userId, roomOwnerId),
        eq(notification.type, "room_liked"),
        eq(notification.referenceId, roomId),
        gte(notification.createdAt, oneHourAgo),
      ),
      orderBy: [desc(notification.createdAt)],
    });

    let title: string;
    let body: string;

    if (recentNotification) {
      // Count total likes in the aggregation window
      const metadata = recentNotification.metadata
        ? JSON.parse(recentNotification.metadata)
        : { count: 1 };
      const newCount = (metadata.count || 1) + 1;

      title = "New Like!";
      body = `${newCount} people liked your Pain Cave`;

      await db
        .update(notification)
        .set({
          body,
          metadata: JSON.stringify({ count: newCount }),
        })
        .where(eq(notification.id, recentNotification.id));
    } else {
      title = "New Like!";
      body = `${likerName} liked your Pain Cave`;

      await db.insert(notification).values({
        userId: roomOwnerId,
        type: "room_liked",
        title,
        body,
        referenceId: roomId,
        metadata: JSON.stringify({ count: 1 }),
      });
    }

    // Get all device tokens for the room owner
    const tokens = await db.query.deviceToken.findMany({
      where: eq(deviceToken.userId, roomOwnerId),
    });

    if (tokens.length === 0) return;

    // Send push notification to each token
    const messaging = admin.messaging();
    const sendPromises = tokens.map(async (t) => {
      try {
        await messaging.send({
          token: t.token,
          notification: { title, body },
          data: { type: "room_liked", roomId },
        });
      } catch (err: any) {
        if (
          err?.code === "messaging/registration-token-not-registered" ||
          err?.code === "messaging/invalid-registration-token"
        ) {
          await db.delete(deviceToken).where(eq(deviceToken.id, t.id));
        } else {
          console.error(
            `[notification-service] FCM send error for token ${t.id}:`,
            err,
          );
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error("[notification-service] sendLikeNotification error:", err);
  }
}

export async function sendReferralRewardNotification(
  referrerId: string,
  referredUserName: string,
): Promise<void> {
  try {
    const admin = await getFirebaseAdmin();

    const title = "Referral Reward!";
    const body = `${referredUserName} validated their first trophy. You earned 500 flames!`;

    await db.insert(notification).values({
      userId: referrerId,
      type: "referral_reward",
      title,
      body,
      metadata: JSON.stringify({ referredUserName }),
    });

    if (!admin) return;

    const tokens = await db.query.deviceToken.findMany({
      where: eq(deviceToken.userId, referrerId),
    });

    if (tokens.length === 0) return;

    const messaging = admin.messaging();
    const sendPromises = tokens.map(async (t) => {
      try {
        await messaging.send({
          token: t.token,
          notification: { title, body },
          data: { type: "referral_reward" },
        });
      } catch (err: any) {
        if (
          err?.code === "messaging/registration-token-not-registered" ||
          err?.code === "messaging/invalid-registration-token"
        ) {
          await db.delete(deviceToken).where(eq(deviceToken.id, t.id));
        } else {
          console.error(
            `[notification-service] FCM send error for token ${t.id}:`,
            err,
          );
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error("[notification-service] sendReferralRewardNotification error:", err);
  }
}

export async function sendStreakReminderNotification(
  userId: string,
  streakDays: number,
  locale: string | null,
): Promise<void> {
  try {
    const admin = await getFirebaseAdmin();

    const isFr = locale === "fr";
    const title = isFr ? "Ne perds pas ta flamme !" : "Don't lose your streak!";
    const body = isFr
      ? `Tu as une série de ${streakDays} jours. Connecte-toi pour la garder !`
      : `You have a ${streakDays}-day streak. Log in to keep it!`;

    await db.insert(notification).values({
      userId,
      type: "streak_reminder",
      title,
      body,
      metadata: JSON.stringify({ streakDays }),
    });

    if (!admin) return;

    const tokens = await db.query.deviceToken.findMany({
      where: eq(deviceToken.userId, userId),
    });

    if (tokens.length === 0) return;

    const messaging = admin.messaging();
    const sendPromises = tokens.map(async (t) => {
      try {
        await messaging.send({
          token: t.token,
          notification: { title, body },
          data: { type: "streak_reminder" },
        });
      } catch (err: any) {
        if (
          err?.code === "messaging/registration-token-not-registered" ||
          err?.code === "messaging/invalid-registration-token"
        ) {
          await db.delete(deviceToken).where(eq(deviceToken.id, t.id));
        } else {
          console.error(
            `[notification-service] FCM send error for token ${t.id}:`,
            err,
          );
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error("[notification-service] sendStreakReminderNotification error:", err);
  }
}
