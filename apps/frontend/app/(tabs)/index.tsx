import { StyleSheet, Pressable, ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
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

export default function HomeScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, "tint");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.api.rooms.me.$get();
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
  }, []);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const hasItems = room && room.items.length > 0;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>{i18n.t("common.error")}</ThemedText>
        <Pressable
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={fetchRoom}
        >
          <ThemedText style={styles.buttonText}>
            {i18n.t("common.retry")}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {hasItems ? (
        <CanvasErrorBoundary>
          <Suspense
            fallback={
              <View style={styles.loaderContainer}>
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
      ) : (
        <View style={styles.emptyState}>
          <ThemedText type="title">{i18n.t("home.title")}</ThemedText>
          <ThemedText style={styles.emptyText}>
            {i18n.t("room.empty")}
          </ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={() => router.push("/trophy/scan")}
          >
            <ThemedText style={styles.buttonText}>
              {i18n.t("trophies.scan")}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Floating action buttons */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={() => router.push("/room/edit")}
        >
          <ThemedText style={styles.fabText}>{i18n.t("room.edit")}</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => router.push("/trophy/scan")}
        >
          <ThemedText style={[styles.fabText, { color: tintColor }]}>
            {i18n.t("trophies.scan")}
          </ThemedText>
        </Pressable>
      </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 16,
    gap: 12,
    alignItems: "flex-end",
  },
  fab: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
  },
  fabSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
