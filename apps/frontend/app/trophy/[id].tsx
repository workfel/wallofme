import { StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function TrophyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Trophy</ThemedText>
      <ThemedText style={styles.id}>ID: {id}</ThemedText>
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
  id: {
    marginTop: 12,
    opacity: 0.7,
  },
});
