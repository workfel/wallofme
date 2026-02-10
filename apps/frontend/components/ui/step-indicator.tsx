import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type StepIndicatorProps = {
  steps: string[];
  currentStep: number;
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const colorScheme = useColorScheme() ?? "light";
  const tint = Colors[colorScheme].tint;
  const icon = Colors[colorScheme].icon;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepWrapper}>
            {index > 0 && (
              <View style={styles.lineWrapper}>
                <View style={[styles.lineBase, { backgroundColor: icon + "30" }]} />
                <AnimatedLine active={index <= currentStep} tint={tint} />
              </View>
            )}
            <AnimatedDot
              active={index <= currentStep}
              current={index === currentStep}
              tint={tint}
              icon={icon}
            />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {steps.map((label, index) => (
          <ThemedText
            key={label}
            style={[
              styles.label,
              { opacity: index <= currentStep ? 1 : 0.4 },
            ]}
          >
            {label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

function AnimatedDot({
  active,
  current,
  tint,
  icon,
}: {
  active: boolean;
  current: boolean;
  tint: string;
  icon: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? tint : icon + "30", { duration: 300 }),
    transform: [{ scale: withSpring(current ? 1.25 : 1) }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

function AnimatedLine({ active, tint }: { active: boolean; tint: string }) {
  const animatedStyle = useAnimatedStyle(() => ({
    flex: withTiming(active ? 1 : 0, { duration: 400 }),
  }));

  return (
    <Animated.View
      style={[styles.lineFill, { backgroundColor: tint }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lineWrapper: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    position: "relative",
  },
  lineBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 1,
  },
  lineFill: {
    height: "100%",
    borderRadius: 1,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    textAlign: "center",
    flex: 1,
  },
});
