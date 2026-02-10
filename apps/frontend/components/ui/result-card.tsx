import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import i18n from "@/lib/i18n";

type ResultCardProps = {
  time?: string | null;
  ranking?: number | null;
  categoryRanking?: number | null;
  totalParticipants?: number | null;
  source?: string | null;
};

export function ResultCard({
  time,
  ranking,
  categoryRanking,
  totalParticipants,
  source,
}: ResultCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const tint = Colors[colorScheme].tint;

  const rows: { icon: string; label: string; value: string }[] = [];

  if (time) {
    rows.push({ icon: "\u23F1", label: i18n.t("review.time"), value: time });
  }
  if (ranking != null) {
    const rankStr = totalParticipants
      ? `${ranking} / ${totalParticipants}`
      : `${ranking}`;
    rows.push({
      icon: "\uD83C\uDFC6",
      label: i18n.t("review.ranking"),
      value: rankStr,
    });
  }
  if (categoryRanking != null) {
    rows.push({
      icon: "\uD83C\uDFF7\uFE0F",
      label: i18n.t("review.categoryRanking"),
      value: `${categoryRanking}`,
    });
  }

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      style={[styles.card, { backgroundColor: tint + "15" }]}
    >
      <ThemedText type="subtitle" style={styles.title}>
        {i18n.t("review.resultsFound")}
      </ThemedText>

      {rows.map((row, index) => (
        <Animated.View
          key={row.label}
          entering={FadeInDown.delay(150 * (index + 1))
            .springify()
            .damping(15)}
          style={styles.row}
        >
          <ThemedText style={styles.icon}>{row.icon}</ThemedText>
          <ThemedText style={styles.label}>{row.label}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.value}>
            {row.value}
          </ThemedText>
        </Animated.View>
      ))}

      {source && (
        <Animated.View
          entering={FadeInDown.delay(150 * (rows.length + 1))}
        >
          <ThemedText style={styles.source}>
            {i18n.t("review.source")}: {source}
          </ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
    gap: 4,
  },
  title: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  icon: {
    fontSize: 20,
    width: 32,
  },
  label: {
    flex: 1,
    opacity: 0.7,
  },
  value: {
    fontSize: 18,
  },
  source: {
    opacity: 0.5,
    fontSize: 12,
    marginTop: 8,
  },
});
