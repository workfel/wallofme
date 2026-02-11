import {
  StyleSheet,
  Pressable,
  ActivityIndicator,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CanvasErrorBoundary } from "@/components/room/canvas-error-boundary";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";
import { getNextSlotPosition, getWallSlots } from "@/lib/room-placement";

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

type Trophy = {
  id: string;
  type: "medal" | "bib";
  textureUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
};

type RoomItem = {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  wall: "left" | "right" | null;
  trophy?: Trophy | null;
  decoration?: { id: string; name: string; modelUrl: string | null } | null;
};

type RoomData = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem[];
};

export default function RoomEditScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, "tint");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [room, setRoom] = useState<RoomData | null>(null);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomRes, trophiesRes] = await Promise.all([
        api.api.rooms.me.$get(),
        api.api.trophies.$get({ query: { page: "1", limit: "50" } }),
      ]);

      if (roomRes.ok) {
        const roomJson = await roomRes.json();
        setRoom(roomJson.data as unknown as RoomData);
      }
      if (trophiesRes.ok) {
        const trophiesJson = await trophiesRes.json();
        setTrophies(trophiesJson.data as unknown as Trophy[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const placedTrophyIds = new Set(
    room?.items.filter((i) => i.trophyId).map((i) => i.trophyId!) ?? []
  );

  const availableTrophies = trophies.filter(
    (t) => t.status === "ready" && t.textureUrl && !placedTrophyIds.has(t.id)
  );

  const handleAddTrophy = useCallback(
    async (trophyId: string) => {
      if (!room) return;
      const slot = getNextSlotPosition(room.items);
      if (!slot) return; // both walls full
      try {
        const res = await api.api.rooms.items.$post({
          json: {
            trophyId,
            positionX: slot.positionX,
            positionY: slot.positionY,
            positionZ: slot.positionZ,
            rotationY: 0,
            wall: slot.wall,
          },
        });
        if (res.ok) {
          await fetchData();
        }
      } catch {
        // ignore
      }
    },
    [room, fetchData]
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      try {
        const res = await api.api.rooms.items[":id"].$delete({
          param: { id: itemId },
        });
        if (res.ok) {
          setSelectedItemId(null);
          await fetchData();
        }
      } catch {
        // ignore
      }
    },
    [fetchData]
  );

  const handleChangeWall = useCallback(
    async (itemId: string, newWall: "left" | "right") => {
      if (!room) return;
      // Exclude the item being moved to find an open slot on the target wall
      const otherItems = room.items.filter((i) => i.id !== itemId);
      const slots = getWallSlots(newWall);
      const occupied = new Set(
        otherItems
          .filter((i) => i.wall === newWall)
          .map((i) => `${i.positionX}:${i.positionY}:${i.positionZ}`)
      );
      const freeSlot = slots.find(
        (s) => !occupied.has(`${s.positionX}:${s.positionY}:${s.positionZ}`)
      );
      if (!freeSlot) return;
      try {
        const res = await api.api.rooms.items[":id"].$patch({
          param: { id: itemId },
          json: {
            positionX: freeSlot.positionX,
            positionY: freeSlot.positionY,
            positionZ: freeSlot.positionZ,
            wall: newWall,
          },
        });
        if (res.ok) {
          setSelectedItemId(null);
          await fetchData();
        }
      } catch {
        // ignore
      }
    },
    [room, fetchData]
  );

  const handleItemPress = useCallback(
    (itemId: string) => {
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
        return;
      }
      setSelectedItemId(itemId);

      const item = room?.items.find((i) => i.id === itemId);
      if (!item) return;

      const otherWall = item.wall === "left" ? "right" : "left";
      const wallLabel =
        otherWall === "left"
          ? i18n.t("room.leftWall")
          : i18n.t("room.backWall");

      Alert.alert(
        item.trophy?.type === "medal"
          ? i18n.t("trophies.medal")
          : i18n.t("trophies.bib"),
        undefined,
        [
          {
            text: `${i18n.t("room.moveTo")} ${wallLabel}`,
            onPress: () => handleChangeWall(itemId, otherWall),
          },
          {
            text: i18n.t("room.removeTrophy"),
            style: "destructive",
            onPress: () => handleRemoveItem(itemId),
          },
          { text: i18n.t("common.cancel"), style: "cancel" },
        ]
      );
    },
    [selectedItemId, room, handleChangeWall, handleRemoveItem]
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 3D Scene — top 55% */}
      <View style={styles.sceneContainer}>
        {room ? (
          <CanvasErrorBoundary>
            <Suspense
              fallback={
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={tintColor} />
                </View>
              }
            >
              <FiberCanvas style={styles.canvas} orthographic room={room}>
                <PainCaveScene
                  room={room}
                  editable
                  onItemPress={handleItemPress}
                />
                <CameraControls />
              </FiberCanvas>
            </Suspense>
          </CanvasErrorBoundary>
        ) : (
          <View style={styles.centered}>
            <ThemedText>{i18n.t("common.error")}</ThemedText>
          </View>
        )}
      </View>

      {/* Panel — bottom 45% */}
      <View
        style={[
          styles.panel,
          { backgroundColor: isDark ? "#1a1a2e" : "#f5f5f5" },
        ]}
      >
        <ThemedText type="defaultSemiBold" style={styles.panelTitle}>
          {i18n.t("room.available")} ({availableTrophies.length})
        </ThemedText>

        {availableTrophies.length === 0 ? (
          <View style={styles.emptyPanel}>
            <ThemedText style={styles.emptyText}>
              {i18n.t("room.noTrophies")}
            </ThemedText>
            <Pressable
              style={[styles.scanButton, { backgroundColor: tintColor }]}
              onPress={() => router.push("/trophy/scan")}
            >
              <ThemedText style={styles.scanButtonText}>
                {i18n.t("trophies.scan")}
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trophyList}
          >
            {availableTrophies.map((trophy) => (
              <View
                key={trophy.id}
                style={[
                  styles.trophyCard,
                  { backgroundColor: isDark ? "#252540" : "#fff" },
                ]}
              >
                {trophy.thumbnailUrl && (
                  <Image
                    source={{ uri: trophy.thumbnailUrl }}
                    style={styles.trophyImage}
                    contentFit="contain"
                  />
                )}
                <ThemedText style={styles.trophyType}>
                  {trophy.type === "medal"
                    ? i18n.t("trophies.medal")
                    : i18n.t("trophies.bib")}
                </ThemedText>
                <Pressable
                  style={[
                    styles.addButton,
                    { backgroundColor: tintColor },
                  ]}
                  onPress={() => handleAddTrophy(trophy.id)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {i18n.t("room.addToRoom")}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
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
  },
  sceneContainer: {
    flex: 55,
  },
  canvas: {
    flex: 1,
  },
  panel: {
    flex: 45,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  panelTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  emptyPanel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 16,
  },
  scanButton: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  trophyList: {
    gap: 12,
    paddingBottom: 16,
  },
  trophyCard: {
    width: 140,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  trophyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  trophyType: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  addButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
