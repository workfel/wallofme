import { useState } from "react";
import { StyleSheet, TextInput, Pressable, Alert, View } from "react-native";
import { Link } from "expo-router";
import * as Linking from "expo-linking";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth";
import i18n from "@/lib/i18n";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authClient.signUp.email({ name, email, password });
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: Linking.createURL("/"),
      });
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        WallOfMe
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        {i18n.t("auth.register")}
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.name")}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.email")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? i18n.t("common.loading") : i18n.t("auth.register")}
        </ThemedText>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <ThemedText style={styles.dividerText}>
          {i18n.t("auth.orContinueWith")}
        </ThemedText>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={[styles.socialButton, styles.googleButton]}
        onPress={() => handleSocialLogin("google")}
        disabled={loading}
      >
        <ThemedText style={styles.socialButtonText}>
          {i18n.t("auth.google")}
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.socialButton, styles.appleButton]}
        onPress={() => handleSocialLogin("apple")}
        disabled={loading}
      >
        <ThemedText style={styles.appleButtonText}>
          {i18n.t("auth.apple")}
        </ThemedText>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="link">{i18n.t("auth.hasAccount")}</ThemedText>
      </Link>
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    opacity: 0.6,
  },
  socialButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  socialButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  appleButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  appleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    alignSelf: "center",
  },
});
