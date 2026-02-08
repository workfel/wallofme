import { useState } from "react";
import { StyleSheet, TextInput, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import i18n from "@/lib/i18n";

export default function OTPScreen() {
  const [code, setCode] = useState("");

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {i18n.t("auth.verifyEmail")}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {i18n.t("auth.otpSent")}
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.otpPlaceholder")}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholderTextColor="#999"
        textAlign="center"
      />

      <Pressable style={styles.button}>
        <ThemedText style={styles.buttonText}>
          {i18n.t("common.confirm")}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 24,
    letterSpacing: 8,
    color: "#333",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
