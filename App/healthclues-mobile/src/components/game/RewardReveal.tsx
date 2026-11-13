import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Sparkles, Trophy, Check, Key } from "lucide-react-native";
import { colors, radius, spacing } from "@/theme";
import { GameIcon } from "@/components/common/GameIcon";

interface RewardRevealProps {
  visible: boolean;
  title: string;
  subtitle: string;
  description: string;
  iconName?: string;
  rarity?: "Common" | "Rare" | "Epic";
  onClaim: () => void;
}

export function RewardReveal({
  visible,
  title,
  subtitle,
  description,
  iconName = "boss:key",
  rarity = "Rare",
  onClaim,
}: RewardRevealProps) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      scale.setValue(0.7);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClaim}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: "100%" }}
            contentContainerStyle={{ alignItems: "center" }}
          >
          {/* Header Rarity Badge */}
          <View style={styles.rarityBadge}>
            <Sparkles size={12} color={colors.goldLight} />
            <Text style={styles.rarityText}>
              {rarity.toUpperCase()} PHẦN THƯỞNG
            </Text>
          </View>

          {/* Glowing Reward Icon Circle */}
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.glowRing,
                { transform: [{ scale: glowPulse }] },
              ]}
            />
            <View style={styles.iconCircle}>
              <GameIcon name={iconName} size={36} tone="gold" />
            </View>
          </View>

          {/* Reward Details */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Claim Button */}
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={onClaim}
            activeOpacity={0.85}
          >
            <Check size={18} color="#042f2e" />
            <Text style={styles.claimBtnText}>Nhận Vào Túi Đồ</Text>
          </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 15, 13, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderGold,
    alignItems: "center",
    shadowColor: colors.goldLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: spacing.md,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.goldLight,
    letterSpacing: 0.8,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.sm,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1.5,
    borderColor: colors.goldLight,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(16, 44, 41, 0.98)",
    borderWidth: 2,
    borderColor: colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textGold,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textEmerald,
    textAlign: "center",
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.emeraldLight,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    width: "100%",
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#042f2e",
  },
});
