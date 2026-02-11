import { Component } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import i18n from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[PainCave3D]", error?.message, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ThemedText type="defaultSemiBold">
            {i18n.t("room.renderError")}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {i18n.t("room.renderErrorHint")}
          </ThemedText>
          <ThemedText style={styles.errorDetail}>
            {this.state.errorMessage}
          </ThemedText>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: "center",
    fontSize: 13,
  },
  errorDetail: {
    marginTop: 12,
    opacity: 0.4,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "monospace",
  },
});
