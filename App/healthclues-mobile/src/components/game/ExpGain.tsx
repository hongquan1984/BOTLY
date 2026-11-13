import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { Sparkles } from "lucide-react-native";
import { colors } from "@/theme";

interface ExpGainProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export function ExpGain({ amount, visible, onComplete }: ExpGainProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;

    // Trigger haptic feedback safely
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    translateY.setValue(0);
    opacity.setValue(0);
    scale.setValue(0.8);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1.15,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -55,
        duration: 1600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [visible, amount]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.badge}>
        <Sparkles size={14} color={colors.goldLight} />
        <Text style={styles.text}>+{amount} EXP</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    zIndex: 999,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10, 24, 21, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
});
