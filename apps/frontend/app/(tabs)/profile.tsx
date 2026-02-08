import { StyleSheet, Pressable, Alert } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth";
import i18n from "@/lib/i18n";

export default function ProfileScreen() {
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (e: any) {
      Alert.alert(i18n.t("common.error"), e.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{i18n.t("profile.title")}</ThemedText>

      {session?.user && (
        <ThemedText style={styles.email}>{session.user.email}</ThemedText>
      )}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>
          {i18n.t("profile.logout")}
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
  email: {
    marginTop: 12,
    opacity: 0.7,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});
