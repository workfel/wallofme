import { StyleSheet, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, Suspense, lazy } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CanvasErrorBoundary } from "@/components/room/canvas-error-boundary";
import { useThemeColor } from "@/hooks/use-theme-color";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";

const FiberCanvas = lazy(() =>
  import("@/lib/fiber-canvas").then((m) => ({ default: m.FiberCanvas }))
);
const PainCaveScene = lazy(() =>
  import("@/components/room/pain-cave-scene").then((m) => ({
    default: m.PainCaveScene,
  }))
);
const CameraControls = lazy(() =>
  import("@/components/room/camera-controls").then((m) => ({
    default: m.CameraControls,
  }))
);

type RoomData = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: {
    id: string;
    trophyId: string | null;
    decorationId: string | null;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationY: number;
    wall: "left" | "right" | null;
    trophy?: {
      id: string;
      type: "medal" | "bib";
      textureUrl: string | null;
      thumbnailUrl: string | null;
    } | null;
    decoration?: {
      id: string;
      name: string;
      modelUrl: string | null;
    } | null;
  }[];
};

export default function RoomVisitScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const tintColor = useThemeColor({}, "tint");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await api.api.rooms.user[":id"].$get({
        param: { id: userId },
      });
      if (res.ok) {
        const json = await res.json();
        setRoom(json.data as unknown as RoomData);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error || !room) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>{i18n.t("common.error")}</ThemedText>
      </ThemedView>
    );
  }

  if (room.items.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.emptyText}>
          {i18n.t("room.empty")}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CanvasErrorBoundary>
        <Suspense
          fallback={
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={tintColor} />
            </View>
          }
        >
          <FiberCanvas style={styles.canvas} orthographic room={room}>
            <PainCaveScene room={room} />
            <CameraControls />
          </FiberCanvas>
        </Suspense>
      </CanvasErrorBoundary>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  canvas: {
    flex: 1,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
  },
});
