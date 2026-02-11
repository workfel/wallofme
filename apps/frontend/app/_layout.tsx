import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { TamaguiProvider } from "tamagui";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import config from "@/tamagui.config";
import { authClient } from "@/lib/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const user = session?.user as
      | (typeof session & { firstName?: string | null })["user"]
      | undefined;
    const hasFirstName = !!(user as any)?.firstName;

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      if (!hasFirstName) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } else if (session && inOnboarding && hasFirstName) {
      router.replace("/(tabs)");
    } else if (session && !inOnboarding && !inAuthGroup && !hasFirstName) {
      router.replace("/onboarding");
    }
  }, [session, isPending, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="trophy/[id]"
              options={{ title: "Trophy" }}
            />
            <Stack.Screen
              name="trophy/scan"
              options={{ presentation: "modal", title: "Scan Trophy" }}
            />
            <Stack.Screen
              name="trophy/review"
              options={{ title: "Review" }}
            />
            <Stack.Screen
              name="room/edit"
              options={{ title: "Edit Room" }}
            />
            <Stack.Screen
              name="room/[userId]"
              options={{ title: "Pain Cave" }}
            />
          </Stack>
        </AuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TamaguiProvider>
  );
}
