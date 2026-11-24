import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStoredSession } from "@/services/api";
import { colors } from "@/theme";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [session, onboardingCompleted] = await Promise.all([
          getStoredSession(),
          AsyncStorage.getItem("healthclues-onboarding-completed"),
        ]);
        if (!active) return;

        // If user hasn't completed quiz, ALWAYS show Quiz / Welcome Onboarding first (matching web game)
        if (onboardingCompleted !== "true") {
          router.replace("/(onboarding)/quiz");
          return;
        }

        // A completed quiz is not an account. Require an email/password session
        // before entering the persistent game so Journey, Backpack and rewards
        // cannot silently remain browser-only state.
        if (!session?.access_token) {
          router.replace("/(auth)/login");
          return;
        }

        // If quiz completed and the player is authenticated, enter RPG World
        router.replace("/(game)/world");
      } catch {
        if (active) router.replace("/(onboarding)/quiz");
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.emerald} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
