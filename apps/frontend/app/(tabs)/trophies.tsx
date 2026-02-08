import { StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import i18n from "@/lib/i18n";

export default function TrophiesScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{i18n.t("trophies.title")}</ThemedText>
      <ThemedText style={styles.subtitle}>
        {i18n.t("trophies.empty")}
      </ThemedText>

      <Pressable
        style={styles.scanButton}
        onPress={() => router.push("/trophy/scan")}
      >
        <ThemedText style={styles.scanButtonText}>
          {i18n.t("trophies.scan")}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  subtitle: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  scanButton: {
    marginTop: 24,
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
