import { useState } from "react";
import { StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";

function splitName(fullName?: string | null): [string, string] {
  if (!fullName) return ["", ""];
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");
  return [first, last];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session, refetch } = authClient.useSession();
  const [defaultFirst, defaultLast] = splitName(session?.user?.name);

  const [firstName, setFirstName] = useState(defaultFirst);
  const [lastName, setLastName] = useState(defaultLast);
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        i18n.t("common.error"),
        i18n.t("onboarding.fieldsRequired")
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.api.users.onboarding.$post({
        json: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          ...(country.trim() ? { country: country.trim().toUpperCase() } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      // Refresh session so AuthGate sees the updated firstName
      await refetch();
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {i18n.t("onboarding.title")}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {i18n.t("onboarding.subtitle")}
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("onboarding.firstName")}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("onboarding.lastName")}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("onboarding.country")}
        value={country}
        onChangeText={setCountry}
        autoCapitalize="characters"
        maxLength={2}
        placeholderTextColor="#999"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? i18n.t("common.loading") : i18n.t("onboarding.continue")}
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
    fontSize: 16,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
