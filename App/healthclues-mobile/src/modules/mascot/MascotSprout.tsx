import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { MessageCircle } from "lucide-react-native";
import { playDolphinChirp, playDolphinGiggle } from "../audio/dolphinAudio";

export type SproutMood = "idle" | "talk" | "laugh" | "sad" | "sulk" | "wave";

export const MASCOT_SPRITES: Record<SproutMood, any> = {
  idle: require("../../../assets/game/characters/healthclues-sprout-rabbit-idle.png"),
  talk: require("../../../assets/game/characters/healthclues-sprout-rabbit-talk.png"),
  sad: require("../../../assets/game/characters/healthclues-sprout-rabbit-sad.png"),
  wave: require("../../../assets/game/characters/healthclues-sprout-rabbit-wave.png"),
  laugh: require("../../../assets/game/characters/healthclues-sprout-rabbit-laugh.png"),
  sulk: require("../../../assets/game/characters/healthclues-sprout-rabbit-sulk.png"),
};

interface MascotSproutProps {
  mood?: SproutMood;
  onPress?: () => void;
  size?: number;
  showBubbleHint?: boolean;
  bubbleText?: string;
  accessibilityLabel?: string;
}

export function MascotSprout({
  mood = "talk",
  onPress,
  size = 110,
  showBubbleHint = true,
  bubbleText = "Chạm vào mình nhé!",
  accessibilityLabel = "Linh vật Mầm Nhỏ tương tác",
}: MascotSproutProps) {
  const floatY = useSharedValue(0);
  const breatheScale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const pulseRing = useSharedValue(1);

  useEffect(() => {
    // Hiệu ứng lơ lửng nhẹ nhàng
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Hiệu ứng thở phập phồng nhẹ (Breathing pulse 0.975 -> 1.045)
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.045, { duration: 1150, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.975, { duration: 1150, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Hiệu ứng lắc nhún nhẹ (Wobble) định kỳ
    tilt.value = withRepeat(
      withSequence(
        withTiming(0.04, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(-0.04, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Vòng hào quang phát sáng nhẹ
    pulseRing.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1600, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 1600, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, [floatY, breatheScale, tilt, pulseRing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: breatheScale.value },
      { rotateZ: `${tilt.value}rad` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRing.value }],
    opacity: 0.35 + (pulseRing.value - 1) * 2,
  }));

  const handlePress = () => {
    // Phát âm thanh tiếng cá heo đáng yêu (Dolphin chirp / giggle)
    if (mood === "laugh" || Math.random() > 0.5) {
      playDolphinGiggle(0.35);
    } else {
      playDolphinChirp(0.38);
    }
    onPress?.();
  };

  const spriteSource = MASCOT_SPRITES[mood] || MASCOT_SPRITES.talk;

  return (
    <View style={styles.outerContainer}>
      {showBubbleHint && (
        <View style={styles.speechBubble}>
          <MessageCircle size={12} color="#10b981" />
          <Text style={styles.speechText} numberOfLines={1}>
            {bubbleText}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.wrapper,
          { width: size + 20, height: size + 20 },
          Platform.OS === "web" ? ({ outlineStyle: "none", outline: "none" } as any) : null,
        ]}
      >
        {/* Vòng hào quang phập phồng báo hiệu tương tác */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
            },
            ringStyle,
          ]}
        />

        {/* Nhân vật Mầm Nhỏ (Authentic Sprite Sheet) với animation thở & lơ lửng */}
        <Animated.View style={[styles.mascotBody, { width: size, height: size }, animatedStyle]}>
          <Image
            source={spriteSource}
            style={{ width: size, height: size }}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  speechBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 32, 26, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.5)",
    marginBottom: 6,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    gap: 5,
  },
  speechText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#a7f3d0",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.4)",
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 3,
  },
  mascotBody: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
});
