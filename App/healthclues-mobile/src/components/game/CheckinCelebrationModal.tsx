import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Sparkles, Star, Flame, Trophy, CheckCircle2, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing, typography } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CheckinCelebrationModalProps {
  visible: boolean;
  stars: number;
  expAwarded: number;
  streakDays?: number;
  onClose: () => void;
}

export function CheckinCelebrationModal({
  visible,
  stars,
  expAwarded,
  streakDays = 3,
  onClose,
}: CheckinCelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starBounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    scaleAnim.setValue(0.7);
    opacityAnim.setValue(0);
    starBounceAnim.setValue(0);
    sparkleRotateAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(starBounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.timing(sparkleRotateAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const spin = sparkleRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: "100%" }}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {/* Glowing Aura Ring */}
          <View style={styles.glowAura} />

          {/* Top Mascot Header */}
          <View style={styles.mascotWrapper}>
            <Image
              source={require("../../../assets/game/ui/lumi_fox_clean.png")}
              style={styles.mascotImage}
              contentFit="contain"
            />
            <Animated.View style={[styles.rotatingSparkle, { transform: [{ rotate: spin }] }]}>
              <Sparkles size={24} color="#fde047" />
            </Animated.View>
          </View>

          {/* Title Banner */}
          <View style={styles.badgeBanner}>
            <Trophy size={14} color="#f59e0b" />
            <Text style={styles.badgeBannerText}>HOÀN THÀNH ĐIỂM DANH HÔM NAY</Text>
          </View>

          <Text style={styles.title}>Xuất Sắc Vượt Bậc!</Text>
          <Text style={styles.subtitle}>
            Bạn đã hoàn thành các thói quen vàng và nuôi dưỡng sức khỏe thể chất trọn vẹn hôm nay.
          </Text>

          {/* Star Rating Display */}
          <Animated.View
            style={[
              styles.starsContainer,
              {
                transform: [
                  {
                    scale: starBounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.starWrapper}>
                <Star
                  size={32}
                  color={i <= stars ? "#fde047" : "rgba(255, 255, 255, 0.15)"}
                  fill={i <= stars ? "#fde047" : "transparent"}
                />
              </View>
            ))}
          </Animated.View>
          <Text style={styles.starScoreText}>Đánh giá chất lượng: {stars}/5 Sao Vàng</Text>

          {/* EXP Reward & Streak Badges */}
          <View style={styles.rewardsRow}>
            <View style={styles.expRewardPill}>
              <Sparkles size={16} color="#fef08a" />
              <Text style={styles.expRewardText}>+{expAwarded} EXP</Text>
            </View>

            <View style={styles.streakPill}>
              <Flame size={16} color="#f97316" />
              <Text style={styles.streakText}>Chuỗi {streakDays} Ngày 🔥</Text>
            </View>
          </View>

          {/* Doctor / Mascot Advice */}
          <View style={styles.adviceBox}>
            <Text style={styles.adviceText}>
              🦊 <Text style={{ fontWeight: "800", color: "#34d399" }}>Bé Cáo Lumi:</Text> "Duy trì uống đủ nước và vận động nhẹ mỗi tối giúp đào thải acid uric tự nhiên, bảo vệ khớp vững vàng!"
            </Text>
          </View>

          {/* Big 3D Gold Claim Button */}
          <TouchableOpacity
            style={styles.claimBtn}
            accessibilityRole="button"
            accessibilityLabel="Thu Nhận Thưởng & Tiếp Tục"
            activeOpacity={0.85}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              onClose();
            }}
          >
            <Text style={styles.claimBtnText}>Thu Nhận Thưởng & Tiếp Tục</Text>
            <ArrowRight size={16} color="#042f2e" />
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
    backgroundColor: "rgba(3, 10, 8, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 32, 360),
    maxHeight: "92%",
    backgroundColor: "#071b16",
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.5)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
  },
  glowAura: {
    position: "absolute",
    top: -20,
    width: 140,
    height: 140,
    borderRadius: radius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    zIndex: -1,
  },
  mascotWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 2,
    borderColor: colors.emeraldLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    position: "relative",
  },
  mascotImage: {
    width: 54,
    height: 54,
  },
  rotatingSparkle: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  badgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    marginBottom: spacing.xs,
  },
  badgeBannerText: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  starWrapper: {
    shadowColor: "#fde047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  starScoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.goldLight,
    marginTop: 6,
  },
  rewardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.md,
  },
  expRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#fde047",
  },
  expRewardText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fef08a",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.4)",
  },
  streakText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fdba74",
  },
  adviceBox: {
    backgroundColor: "rgba(10, 32, 26, 0.8)",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    marginTop: spacing.md,
    width: "100%",
  },
  adviceText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: "#fde047",
    marginTop: spacing.lg,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#042f2e",
  },
});
