import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import i18n from "@/lib/i18n";

export default function RoomEditScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{i18n.t("room.edit")}</ThemedText>
      <ThemedText style={styles.subtitle}>
        Room editor will be implemented here.
      </ThemedText>
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
});
